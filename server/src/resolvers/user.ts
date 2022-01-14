import { EntityManager } from "@mikro-orm/postgresql";
import argon2 from "argon2";
import { MyContext } from "src/types";
import { validateRegister } from "src/utils/validateRegister";
import {
    Arg,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { COOKIE_NAME } from "../constants";
import { User } from "../entities/User";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

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

@Resolver()
export class UserResolver {
    @Mutation(() => Boolean)
    async forgotPassowrd(
        @Arg("email") email: string,
        @Ctx() { em }: MyContext
    ) {
        const person = await em.findOne(User, { email });
        return true;
    }

    @Query(() => [User])
    async findUsers(@Ctx() { em }: MyContext): Promise<User[]> {
        return await em.find(User, {});
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { em, req }: MyContext) {
        // You are not logged in
        if (!req.session.userId) {
            return null;
        }

        // User is logged in
        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) return { errors };

        const hashedPassword = await argon2.hash(options.password);
        let user;

        try {
            // Using the custom query builder over MikroORM - typical when running into errors with an ORM
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning("*");
            user = result[0];
        } catch (error) {
            if (error.detail.includes("already exists")) {
                // throw new Error("Username has already been used"); // Why not just do this?
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username has already been used",
                        },
                    ],
                };
            }
            console.log(error);
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
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            usernameOrEmail.includes("@") // could add stronger validation but this works for now
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username does not exist",
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
