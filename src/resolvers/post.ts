import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() { em }: MyContext): Promise<Post[]> {
        return em.find(Post, {});
    }

    @Query(() => Post)
    post(@Ctx() { em }: MyContext): Promise<Post | null> {
        return em.findOne(Post, { id: 2 });
    }
}
