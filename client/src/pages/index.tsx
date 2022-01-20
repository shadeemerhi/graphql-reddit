import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import Layout from "../components/Layout";
import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";

const Index = () => {
    const [{ fetching, data }] = usePostsQuery({
        variables: {
            limit: 20,
            cursor: "",
        },
    });
    return (
        <Layout>
            <NextLink href="/create-post">
                <Link>Create Post</Link>
            </NextLink>
            {fetching && <p>LOADING....</p>}
            <br />
            <Stack spacing={8}>
                {data
                    ? data.posts.map((post) => (
                          <Box p={5} shadow="md" borderWidth="1px">
                              <Heading fontSize="xl">{post.title}</Heading>
                              <Text mt={4}>{post.text}</Text>
                          </Box>
                      ))
                    : null}
            </Stack>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
