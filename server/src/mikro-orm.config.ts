// import { Post } from "./entities/Post";
// import { User } from "./entities/User";
// import { __prod__ } from "./constants";

// import { MikroORM } from "@mikro-orm/core";
// import path from "path";

// export default {
//     migrations: {
//         path: path.join(__dirname, "./migrations"), // path to the folder with migrations
//         pattern: /^[\w-]+\d+\.[tj]s$/,
//     },
//     entities: [Post, User],
//     user: 'shadeemerhi',
//     dbName: "graphreddit",
//     type: "postgresql",
//     debug: !__prod__,
// } as Parameters<typeof MikroORM.init>[0];
