import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import {
    useDeletePostMutation,
    useMeQuery,
    usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import Layout from "../components/Layout";
import {
    Box,
    Button,
    Flex,
    Heading,
    Icon,
    IconButton,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { DeleteIcon, TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import UpdootSection from "./UpdootSection";
import Id from "./post/[id]";

const Index = () => {
    const [variables, setVariables] = useState({ limit: 15, cursor: "" });
    const [{ fetching, data, error }] = usePostsQuery({ variables });
    const [{ data: meData }, _] = useMeQuery();
    const [{ fetching: deleteFetch }, deletePost] = useDeletePostMutation();

    console.log("HERE IS ME", meData?.me?.username);

    if (!fetching && !data) {
        return <div>No posts available. Error: {error?.message}</div>; // Something went wrong
    }
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
                    ? data.posts.posts.map((post) =>
                          !post ? null : (
                              <Box
                                  display="flex"
                                  p={5}
                                  shadow="md"
                                  borderWidth="1px"
                                  borderRadius="8px"
                              >
                                  <UpdootSection post={post} />
                                  <Box width="100%">
                                      <Box
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="space-between"
                                      >
                                          <NextLink
                                              href="/post/[id]"
                                              as={`/post/${post.id}`}
                                          >
                                              <Link>
                                                  <Heading fontSize="xl">
                                                      {post.title}
                                                  </Heading>
                                              </Link>
                                          </NextLink>
                                          {meData?.me?.id ===
                                              post.creator.id && (
                                              <IconButton
                                                  aria-label="delete-post"
                                                  icon={<DeleteIcon />}
                                                  _focus={{ outline: "none" }}
                                                  isLoading={deleteFetch}
                                                  onClick={async () =>
                                                      await deletePost({
                                                          id: post.id,
                                                      })
                                                  }
                                              />
                                          )}
                                      </Box>
                                      <Text>
                                          <span>
                                              <strong>Author: </strong>
                                          </span>
                                          {post.creator.username}
                                      </Text>
                                      <Text mt={4}>{post.textSnippet}</Text>
                                  </Box>
                              </Box>
                          )
                      )
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
