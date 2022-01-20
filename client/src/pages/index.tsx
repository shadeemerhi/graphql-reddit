import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import Layout from "../components/Layout";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

const Index = () => {
    const [{ fetching, data }] = usePostsQuery({
        variables: {
            limit: 20,
            cursor: "",
        },
    });
    return (
        <Layout>
            <Flex justifyContent='space-between' alignItems='center'>
                <Heading>Graph Reddit</Heading>
                <NextLink href="/create-post">
                    <Link>Create Post</Link>
                </NextLink>
            </Flex>
            {fetching && <p>LOADING....</p>}
            <br />
            <Stack spacing={8}>
                {data
                    ? data.posts.map((post) => (
                          <Box p={5} shadow='md' borderWidth='1px' borderRadius='8px'>
                              <Heading fontSize="xl">{post.title}</Heading>
                              <Text mt={4}>
                                  {post.textSnippet}
                              </Text>
                          </Box>
                      ))
                    : null}
            </Stack>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
