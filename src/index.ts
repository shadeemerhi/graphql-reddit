import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();
    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
            store: new RedisStore({ client: redisClient }),
            saveUninitialized: false,
            secret: "keyboard cat",
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: false,
        }),
        context: () => ({ em: orm.em }),
    });

    // Creates graphql endpoint
    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Server Started on PORT 4000");
    });
};

main().catch((err) => {
    console.log(err);
});
