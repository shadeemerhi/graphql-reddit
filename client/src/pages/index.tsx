import { withUrqlClient } from "next-urql";
import Navbar from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [{ fetching, data }] = usePostsQuery();
    return (
        <div>
            <Navbar />
            <div>Hello World</div>
            {fetching  && <p>LOADING....</p>}
            <br />
            {data ? data.posts.map((post) => <div>{post.title}</div>) : null}
        </div>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
