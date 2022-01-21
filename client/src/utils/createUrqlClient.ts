import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import Router from "next/router";
import {
    dedupExchange,
    Exchange,
    fetchExchange,
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
} from "../generated/graphql";
import { betterUpdateQuery } from "../utils/betterUpdateQuery";

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

        console.log("FIELD ARGS", fieldArgs);

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

export const createUrqlClient = (ssrExchange: any) => ({
    url: "http://localhost:4000/graphql",
    fetchOptions: {
        credentials: "include" as const,
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
                        const allFields = cache.inspectFields("Query");
                        const fieldInfos = allFields.filter(
                            (info) => info.fieldName === "posts"
                        );
                        fieldInfos.forEach((fi) => {
                            cache.invalidate("Query", "posts", fi.arguments);
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
});
