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
    textSnippet(@Root() root: Post) {
        return root.text.slice(0, 50);
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
        @Ctx() { req }: MyContext
    ): Promise<PaginatedPosts> {
        // 20 -> 21
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];

        if (req.session.userId) {
            replacements.push(req.session.userId);
        }

        let cursorIndex = 2;
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
            cursorIndex = replacements.length; // Index of cursor changes depending on logged in state
        }

        const posts = await getConnection().query(
            `
        select p.*,
        json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
        ) creator,
        ${
            /**
             * If the current user has voted on the post, set the voteStatus to
             * be the value of that vote, to prevent multiple votes in one direction (up/down)
             */
            // Session not passed in SSR
            req.session.userId
                ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
                : 'null as "voteStatus"'
        }
        from post p
        inner join public.user u on u.id = p."creatorId"
        ${cursor ? `where p."createdAt" < $${cursorIndex}` : ``}

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
        return Post.findOne(id, { relations: ["creator"] }); // performs join for us
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
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: string
    ): Promise<Post | null> {
        const post = await Post.findOne({ where: { id } });
        if (!post) {
            return null;
        }

        if (typeof title !== undefined) {
            await Post.update({ id }, { title });
        }

        return post;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        // Could put try/catch in these areas
        await Post.delete({ id, creatorId: req.session.userId }); // can only delete posts that you are the owner of
        return true;
    }
}
