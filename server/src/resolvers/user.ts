import { User } from "../entities/User";
import { MyContext } from "src/types";
import argon2 from "argon2";

import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

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
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username must be greater than 2 characters",
                    },
                ],
            };
        }

        if (options.password.length <= 2) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Password must be at least 2 characters",
                    },
                ],
            };
        }
        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username,
            password: hashedPassword,
        });

        try {
            await em.persistAndFlush(user);
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
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username });

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

        const valid = await argon2.verify(user.password, options.password);

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

        return {
            user,
        };
    }
}
