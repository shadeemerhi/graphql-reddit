import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const post = orm.em.create(Post, { title: "My First Post" });
    await orm.em.persistAndFlush(post);

    const posts = await orm.em.find(Post, {});
    console.log('HERE ARE THE POSTS', posts);
    
};

main().catch((err) => {
    console.log(err);
});
