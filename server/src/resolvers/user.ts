import argon2 from "argon2";
import { MyContext } from "src/types";
import { validateRegister } from "../utils/validateRegister";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
} from "type-graphql";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

@ObjectType()
class UserResponse {
    @Field(() => User, { nullable: true })
    user?: User;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@Resolver(User)
export class UserResolver {

    // Field Permissions!
    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() { req }: MyContext) {
        // This is the current user and its okay to show them their own email
        if (req.session.userId === user.id) {
            return user.email;
        }
        // current user wants to see someone elses email
        return "";
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { req, redis }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "Password must be at least 2 characters",
                    },
                ],
            };
        }

        // Check token
        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Token expired",
                    },
                ],
            };
        }

        const userIdNum = parseInt(userId);

        const user = await User.findOne(userIdNum);

        // const user = await em.findOne(User, { id: parseInt(userId) });

        // This should basically never happen at this step, but just in case!
        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exists",
                    },
                ],
            };
        }

        await User.update(
            { id: userIdNum },
            { password: await argon2.hash(newPassword) }
        );

        // Remove key from Redis
        await redis.del(key);

        // login after changing password
        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // email is not in the database
            return false;
        }

        const token = v4();

        await redis.set(
            FORGOT_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3
        ); // 3 days
        await sendEmail(
            email,
            `<a href="http:localhost:3000/change-password/${token}">Reset Password</a>`
        );
        return true;
    }

    @Query(() => [User])
    async findUsers(): Promise<User[]> {
        return await User.find();
    }

    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext) {
        // You are not logged in
        if (!req.session.userId) {
            return null;
        }

        // User is logged in
        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) return { errors };

        const hashedPassword = await argon2.hash(options.password);
        let user;

        try {
            // user = await User.create({
            //     username: options.username,
            //     email: options.email,
            //     password: hashedPassword,
            // }).save();

            /**
             * Purposefully did below to show query builder, but above is simpler version
             */
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,
                })
                .returning("*")
                .execute();
            user = result.raw[0];

            console.log("HERE IS RESULT", user);

            // user = result[0];
        } catch (error) {
            console.log("insert error:", error);
            if (error.detail.includes("already exists")) {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username has already been used",
                        },
                    ],
                };
            }
        }

        // store user id session
        // this will set a cookie on the user and keep them logged in
        req.session.userId = user.id;
        return {
            user,
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne({
            where: usernameOrEmail.includes("@") // could add stronger validation but this works for now
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail },
        });
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "Username or email does not exist",
                    },
                ],
            };
        }

        const valid = await argon2.verify(user.password, password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password",
                    },
                ],
            };
        }

        req.session.userId = user.id;
        console.log("HERE IS SESSION", req.session);

        return {
            user,
        };
    }

    @Mutation(() => Boolean, { nullable: true })
    async logout(@Ctx() { req, res }: MyContext) {
        // You are not logged in
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}
