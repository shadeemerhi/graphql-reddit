import { withUrqlClient } from "next-urql";
import React from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useRouter } from "next/router";
import { usePostQuery } from "../../generated/graphql";
import Layout from "../../components/Layout";

const Post: React.FC<{}> = () => {
    const router = useRouter();
    const { id } = router.query;

    const intId = typeof id === "string" ? parseInt(id) : -1;

    const [{ data, error }, _] = usePostQuery({
      pause: intId === -1, // bad URL parameter
        variables: {
            id: intId,
        },
    });
    console.log("====================================");
    console.log("here is the data", data, error);
    console.log("====================================");

    return (
        <Layout>
            Welcome to the Post page of post {id} written by user{" "}
            {data?.post?.creatorId}
        </Layout>
    );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
