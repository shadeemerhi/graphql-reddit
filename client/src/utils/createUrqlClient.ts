import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import Router from "next/router";
import {
    dedupExchange,
    Exchange,
    fetchExchange,
    gql,
    stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
    CreatePostMutation,
    PostsQuery,
    VoteMutationVariables,
    MutationVoteArgs,
    VoteDocument,
} from "../generated/graphql";
import { betterUpdateQuery } from "../utils/betterUpdateQuery";
import { isServer } from "./isServer";

const errorExchange: Exchange =
    ({ forward }) =>
    (ops$) => {
        return pipe(
            forward(ops$),
            tap(({ error }) => {
                if (error?.message.includes("Not Authenticated")) {
                    Router.replace("/login");
                }
            })
        );
    };

export const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;

        const allFields = cache.inspectFields(entityKey);
        const fieldInfos = allFields.filter(
            (info) => info.fieldName === fieldName
        );
        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
        const inCache = cache.resolve(
            cache.resolve(entityKey, fieldKey) as string,
            "posts"
        );
        info.partial = !inCache;
        let hasMore = true;

        // Basically reading data from the cache then returning it
        const results: string[] = [];
        fieldInfos.forEach((item) => {
            // const data = cache.resolve(entityKey, item.fieldKey) as string[];
            const key = cache.resolve(entityKey, item.fieldKey) as string;
            console.log("HERE IS KEY", key);

            const data = cache.resolve(key, "posts") as string[];
            const _hasMore = cache.resolve(key, "hasMore");

            if (!_hasMore) {
                hasMore = _hasMore as boolean;
            }

            console.log("HERE IS DATA", data);
            results.push(...data);
        });

        return { __typename: "PaginatedPosts", hasMore, posts: results };
    };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
    let cookie = "";
    if (isServer()) {
        cookie = ctx.req.headers.cookie;
    }
    return {
        url: "http://localhost:4000/graphql",
        fetchOptions: {
            credentials: "include" as const,
            headers: cookie
                ? {
                      cookie,
                  }
                : undefined,
        },
        exchanges: [
            dedupExchange,
            cacheExchange({
                keys: {
                    PaginatedPosts: () => null,
                },
                resolvers: {
                    // client-side resolvers, will run whenever query is run and can alter how query results look
                    Query: {
                        posts: cursorPagination(),
                    },
                },
                updates: {
                    Mutation: {
                        vote: (_result, args, cache, info) => {
                            const { postId, value } =
                                args as VoteMutationVariables;
                            const data = cache.readFragment(
                                gql`
                                    fragment _ on Post {
                                        id
                                        points
                                        voteStatus
                                    }
                                `,
                                { id: postId }
                            ); // Data or null
                            console.log("data:", _result, data);
                            if (data) {
                                if (data.voteStatus === args.value) return;
                                const newPoints =
                                    (data.points as number) +
                                    (!data.voteStatus ? 1 : 2) * value; // If user hasn't voted before (i.e. voteStatus is null), only add/sub 1
                                cache.writeFragment(
                                    gql`
                                        fragment _ on Post {
                                            points
                                            voteStatus
                                        }
                                    `,
                                    {
                                        id: postId,
                                        points: newPoints,
                                        voteStatus: value,
                                    }
                                );
                            }
                        },
                        login: (_result, args, cache, info) => {
                            betterUpdateQuery<LoginMutation, MeQuery>(
                                cache,
                                {
                                    query: MeDocument,
                                },
                                _result,
                                (result, query) => {
                                    if (result.login.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.login.user,
                                        };
                                    }
                                }
                            );
                        },
                        register: (_result, args, cache, info) => {
                            betterUpdateQuery<RegisterMutation, MeQuery>(
                                cache,
                                {
                                    query: MeDocument,
                                },
                                _result,
                                (result, query) => {
                                    if (result.register.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.register.user,
                                        };
                                    }
                                }
                            );
                        },
                        createPost: (_result, args, cache, info) => {
                            // Below invalidates all posts in the cache, triggering a refetch

                            // allFields represents all "Query" objects in the cache (each time any query is made, a Query is added? - I think)
                            const allFields = cache.inspectFields("Query");
                            // fieldInfos represent all "Query" object of type "posts" - each time we make a post query, one of these is created
                            const fieldInfos = allFields.filter(
                                (info) => info.fieldName === "posts"
                            );
                            // Here we invalidate every single post "Query"'s, and do so by passing the arguments for each specific one (e.g. limit: 15, cursor: 'someDateString')
                            fieldInfos.forEach((fi) => {
                                cache.invalidate(
                                    "Query",
                                    "posts",
                                    fi.arguments
                                );
                            });
                        },
                        logout: (_result, args, cache, info) => {
                            betterUpdateQuery<LogoutMutation, MeQuery>(
                                cache,
                                {
                                    query: MeDocument,
                                },
                                _result,
                                () => ({ me: null })
                            );
                        },
                    },
                },
            }),
            errorExchange,
            ssrExchange,
            fetchExchange,
        ],
    };
};
