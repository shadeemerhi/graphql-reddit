import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import Layout from "../components/Layout";
import {
    Box,
    Button,
    Flex,
    Heading,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";

const Index = () => {
    const [variables, setVariables] = useState({ limit: 15, cursor: "" });
    const [{ fetching, data, error }] = usePostsQuery({ variables });

    if (!fetching && !data) {
        return <div>No posts available</div>; // Something went wrong
    }
    console.log("VARIABLES", variables);
    

    return (
        <Layout>
            <Flex justifyContent="space-between" alignItems="center">
                <Heading>Graph Reddit</Heading>
                <NextLink href="/create-post">
                    {/* <Link>Create Post</Link> */}
                    <Button color="white" colorScheme="twitter">
                        Create Post
                    </Button>
                </NextLink>
            </Flex>
            {fetching && !data && <p>LOADING....</p>}
            <br />
            <Stack spacing={8}>
                {data
                    ? data.posts.posts.map((post) => (
                          <Box
                              p={5}
                              shadow="md"
                              borderWidth="1px"
                              borderRadius="8px"
                          >
                              <Heading fontSize="xl">{post.title}</Heading>
                              <Text><span><strong>Author: </strong></span>{post.creator.username}</Text>
                              <Text mt={4}>{post.textSnippet}</Text>
                          </Box>
                      ))
                    : null}
            </Stack>
            {data && data.posts.hasMore && (
                <Flex justifyContent="center" alignItems="center" my={6}>
                    <Button
                        onClick={() => {
                            setVariables({
                                ...variables,
                                cursor: data.posts.posts[
                                    data.posts.posts.length - 1
                                ].createdAt,
                            });
                        }}
                        color="white"
                        colorScheme="twitter"
                    >
                        Load More
                    </Button>
                </Flex>
            )}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
