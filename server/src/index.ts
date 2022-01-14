import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import * as redis from "redis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";


// Not sure if below is best way
declare module "express-session" {
    interface Session {
        userId: number;
    }
}

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    // await orm.getMigrator().up();
    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();
    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        })
    );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ client: redisClient, disableTouch: true }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: __prod__, // cookie only works in https (only in production)
            },
            saveUninitialized: false,
            secret: "someRandomHiddenString",
            resave: true,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
    });

    // Creates graphql endpoint
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false, // setting cors globally using 'cors' middlewear rather than with Apollo here
    });

    app.listen(4000, () => {
        console.log("Server Started on PORT 4000");
    });
};

main().catch((err) => {
    console.log(err);
});
