import { withUrqlClient } from "next-urql";
import React from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useRouter } from "next/router";
import { usePostQuery } from "../../generated/graphql";
import Layout from "../../components/Layout";
import { Box, Heading } from "@chakra-ui/react";

const Post: React.FC<{}> = () => {
    const router = useRouter();
    const { id } = router.query;

    const intId = typeof id === "string" ? parseInt(id) : -1;

    const [{ data, fetching, error }, _] = usePostQuery({
        pause: intId === -1, // bad URL parameter
        variables: {
            id: intId,
        },
    });
    console.log("====================================");
    console.log("here is the data", data, error, fetching);
    console.log("====================================");

    if (fetching) {
      return <Layout>LOADING</Layout>
    }

    if (!data?.post) {
      return (
        <Layout>
          <Box>Could not find post</Box>
        </Layout>
      )
    }

    return (
        <Layout>
            <Heading mb={4}>{data?.post?.title}</Heading>
            {data?.post?.text}
        </Layout>
    );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
