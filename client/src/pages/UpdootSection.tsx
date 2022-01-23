import { TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
    PostSnippetFragment,
    PostsQuery,
    useVoteMutation,
} from "../generated/graphql";

type UpdootSectionProps = {
    post: PostSnippetFragment;
    // post: PostsQuery['posts']['posts'][0]; // Another way of getting the post type
};

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<
        "updoot-loading" | "downdoot-loading" | "not-loading"
    >("not-loading");
    const [{ data, error }, vote] = useVoteMutation();

    const onVote = async (state: typeof loadingState, value: number) => {
        // Prevent multiple votes in a single direction (up/down)
        if (post.voteStatus === value) {
            return;
        }
        setLoadingState(state);
        await vote({ postId: post.id, value });
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
                color={post.voteStatus === 1 ? 'green.400' : 'gray'}
                aria-label="upvote"
                icon={<TriangleUpIcon />}
                _focus={{ outline: "none" }}
                isLoading={loadingState === 'updoot-loading'}
                onClick={() => onVote("updoot-loading", 1)}
                />
            {post.points}
            <br />
            {JSON.stringify(post.voteStatus)}
            <IconButton
                color={post.voteStatus === -1 ? "red" : 'gray'}
                aria-label="downvote"
                icon={<TriangleDownIcon />}
                _focus={{ outline: "none" }}
                isLoading={loadingState === 'downdoot-loading'}
                onClick={() => onVote("downdoot-loading", -1)}
            />
        </Box>
    );
};
export default UpdootSection;
