import { ApolloCache, gql } from "@apollo/client";
import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
    Post,
    PostSnippetFragment,
    PostsQuery,
    useVoteMutation,
    VoteMutation,
} from "../generated/graphql";

type UpdootSectionProps = {
    post: PostSnippetFragment;
    // post: PostsQuery['posts']['posts'][0]; // Another way of getting the post type
};

const updateAfterVote = (
    postId: number,
    value: number,
    cache: ApolloCache<VoteMutation>
) => {
    const data = cache.readFragment<{
        id: number;
        points: number;
        voteStatus: number | null;
    }>({
        id: "Post:" + postId,
        fragment: gql`
            fragment _ on Post {
                id
                points
                voteStatus
            }
        `,
    });
    if (data) {
        if (data.voteStatus === value) return;
        const newPoints =
            (data.points as number) + (!data.voteStatus ? 1 : 2) * value; // If user hasn't voted before (i.e. voteStatus is null), only add/sub 1
        cache.writeFragment({
            id: 'Post:' + postId,
            fragment: gql`
                fragment _ on Post {
                    points
                    voteStatus
                }
            `,
            data: {
                points: newPoints,
                voteStatus: value,
            },
        });
    }
};

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<
        "updoot-loading" | "downdoot-loading" | "not-loading"
    >("not-loading");
    const [vote] = useVoteMutation();

    const onVote = async (state: typeof loadingState, value: number) => {
        // Prevent multiple votes in a single direction (up/down)
        if (post.voteStatus === value) {
            return;
        }
        setLoadingState(state);
        await vote({
            variables: { postId: post.id, value },
            update: (cache) => updateAfterVote(post.id, value, cache),
        });
        setLoadingState("not-loading");
    };
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            mr={6}
        >
            <IconButton
                color={post.voteStatus === 1 ? "green.400" : "gray"}
                aria-label="upvote"
                icon={<TriangleUpIcon />}
                _focus={{ outline: "none" }}
                isLoading={loadingState === "updoot-loading"}
                onClick={() => onVote("updoot-loading", 1)}
            />
            {post.points}
            <IconButton
                color={post.voteStatus === -1 ? "red" : "gray"}
                aria-label="downvote"
                icon={<TriangleDownIcon />}
                _focus={{ outline: "none" }}
                isLoading={loadingState === "downdoot-loading"}
                onClick={() => onVote("downdoot-loading", -1)}
            />
        </Box>
    );
};
export default UpdootSection;
