import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";

const main = async () => {
    const orm = await MikroORM.init({
        entities: [Post],
        dbName: "graphreddit",
        user: "",
        password: "",
        debug: !__prod__,
        type: "postgresql",
    });

    const post = orm.em.create(Post, { title: "My First Post" });
    await orm.em.persistAndFlush(post);
};

main().catch(err => {
  console.log(err);
});
