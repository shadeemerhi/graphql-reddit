import "reflect-metadata";
import "dotenv-safe/config";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
// import * as redis from "redis";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

// Not sure if below is best way
declare module "express-session" {
    interface Session {
        userId: number;
    }
}

const main = async () => {
    try {
        const conn = await createConnection({
            type: "postgres",
            url: process.env.DATABASE_URL,
            logging: true,
            // synchronize: true, // don't need to run migrations - don't want to do in production
            migrations: [path.join(__dirname, "./migrations/*")],
            entities: [Post, User, Updoot],
        });
        await conn.runMigrations();
    } catch (error) {
        console.log("DB CONNECTION ERROR", error);
    }

    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new Redis(process.env.REDIS_URL);
    /**
     * telling express that we have nginx sitting in front of api
     * allows for cookies and sessions to work
     */
    app.set("proxy", 1);
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        })
    );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ client: redis, disableTouch: true }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: __prod__, // cookie only works in https (only in production)
                domain: __prod__ ? ".first-project.com" : undefined,
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: true,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({
            req,
            res,
            redis,
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader(),
        }),
    });

    // Creates graphql endpoint
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false, // setting cors globally using 'cors' middlewear rather than with Apollo here
    });

    app.listen(parseInt(process.env.PORT), () => {
        console.log("Server Started on PORT 4000");
    });
};

main().catch((err) => {
    console.log(err);
});
