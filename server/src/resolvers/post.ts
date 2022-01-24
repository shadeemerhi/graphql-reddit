import { Post } from "../entities/Post";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection, QueryBuilder } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
    @Field()
    title: string;

    @Field()
    text: string;
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];
    @Field()
    hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() post: Post) {
        return post.text.slice(0, 50);
    }

    /**
     * Will fetch the creator no matter where post is coming from
     * i.e. a sql request will be made to find the creator for the fetched post
     * which means we can remove the json_build_object and the join in 'posts' and 'post'
     */
    @FieldResolver(() => User)
    creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(post.creatorId); // batches ids into a single function call
    }

    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,
        @Ctx() { req, updootLoader }: MyContext
    ) {
        // do not have a vote status if not logged in
        if (!req.session.userId) {
            return null;
        }
        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId,
        });

        return updoot ? updoot.value : null;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth) // protect this route with auth middleware
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const isUpdoot = value !== -1;
        const voteValue = isUpdoot ? 1 : -1;
        const { userId } = req.session;

        const updoot = await Updoot.findOne({ where: { postId, userId } });

        // the user has voted on the post and they're changing the vote (i.e. updating vote)
        if (updoot && updoot.value !== voteValue) {
            await getConnection().transaction(async (transManager) => {
                await transManager.query(
                    `
                update updoot
                set value = $1
                where "userId" = $2 and "postId" = $3 
                `,
                    [voteValue, userId, postId]
                );

                await transManager.query(
                    `
                update post
                set points = points + $1
                where id = $2
                `,
                    [2 * voteValue, postId] // need to add/subtract 2 if updating
                );
            });
        }
        // has not voted on this post before
        else if (!updoot) {
            await getConnection().transaction(async (transManager) => {
                await transManager.query(
                    `
                insert into updoot ("userId", "postId", "value")
                values ($1, $2, $3)
                `,
                    [userId, postId, voteValue]
                );

                await transManager.query(
                    `
                update post
                set points = points + $1
                where id = $2
                returning *;
                `,

                    [voteValue, postId]
                );
            });
        }
        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() {}: MyContext
    ): Promise<PaginatedPosts> {
        // 20 -> 21
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(
            `
        select p.*
        from post p
        ${cursor ? `where p."createdAt" < $2` : ``}
        order by p."createdAt" DESC
        limit $1
        `,
            replacements
        );

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        // return Post.findOne(id, { relations: ["creator"] }); // performs join for us
        /**
         * added field resolver to get creator, which will be done together with below
         * if we didn't have the field resolver, we could use above to get the creator
         * (two ways of doing the same thing)
         */
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return Post.create({
            ...input,
            creatorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", () => String) title: string,
        @Arg("text", () => String) text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        const post = await Post.findOne({ where: { id } });
        if (!post) {
            return null;
        }

        if (post.creatorId !== req.session.userId) {
            throw new Error("Not Authorized");
        }

        const result = await getConnection()
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where("id = :id", { id })
            .returning("*")
            .execute();

        return result.raw[0];
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        // Could put try/catch in these areas
        const post = await Post.findOne(id);

        if (!post) {
            return false;
        }

        if (post.creatorId !== req.session.userId) {
            throw new Error("Not Authorized");
        }

        await Post.delete({ id });
        return true;
    }
}
