import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from 'next/link';
import Layout from "../components/Layout";
import { Link } from "@chakra-ui/react";

const Index = () => {
    const [{ fetching, data }] = usePostsQuery();
    return (
        <Layout>
            <NextLink href="/create-post">
                <Link>Create Post</Link>
            </NextLink>
            {fetching && <p>LOADING....</p>}
            <br />
            {data ? data.posts.map((post) => <div>{post.title}</div>) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
