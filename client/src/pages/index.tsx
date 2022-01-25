import { DeleteIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { withApollo } from '../utils/withApollo';
import NextLink from "next/link";
import Layout from "../components/Layout";
import UpdootSection from "../components/UpdootSection";
import {
    PostsQuery,
    useDeletePostMutation,
    useMeQuery,
    usePostsQuery,
} from "../generated/graphql";

const Index = () => {
    const { loading, data, error, fetchMore, variables } = usePostsQuery({
        variables: { limit: 15, cursor: "" },
        notifyOnNetworkStatusChange: true,
    });
    const { data: meData } = useMeQuery();
    const [deletePost, { loading: deleteFetch }] = useDeletePostMutation();

    if (!loading && !data) {
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
            {loading && !data && <p>LOADING....</p>}
            <br />
            <Stack spacing={8}>
                {data
                    ? data.posts.posts.map((post) =>
                          !post ? null : (
                              <Box
                                  key={post.id as number}
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
                                                          variables: {
                                                              id: post.id,
                                                          },
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
                        isLoading={loading}
                        onClick={() => {
                            fetchMore({
                                variables: {
                                    limit: variables?.limit,
                                    cursor: data.posts.posts[
                                        data.posts.posts.length - 1
                                    ].createdAt,
                                },
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

export default withApollo({ ssr: true })(Index);
