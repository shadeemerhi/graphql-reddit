import { ApolloProvider, useApolloClient } from "@apollo/client";
import { Box, Button, Flex, Heading, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

const Navbar: React.FC<NavBarProps> = () => {
    const router = useRouter();
    const apollo = useApolloClient();
    const [logout, { loading: logoutFetching }] = useLogoutMutation();
    const { loading, error, data } = useMeQuery({
        skip: isServer(), // pause rendering until ssr is complete
        /**
         * Since now we are doing SSR cookie forwarding, we don't *need* to pause rendering if on server,
         * however we will keep it as this query doesn't *need* to be done on the server
         */
    });
    console.log('====================================');
    console.log('HERE IS DATA', data?.me);
    console.log('====================================');

    let body = null;

    // data is loading
    if (loading) {
    }
    // user not logged in
    else if (!data?.me) {
        body = (
            <Box display="flex" justifyContent="space-between">
                <Box>
                    <NextLink href="/login">
                        <Link color={"white"} mr={4}>
                            Login
                        </Link>
                    </NextLink>
                    <NextLink href="/register">
                        <Link color={"white"}>Register</Link>
                    </NextLink>
                </Box>
            </Box>
        );
    }
    // user is logged in
    else {
        body = (
            <Box display={"flex"} alignItems={"center"}>
                <Box>
                    <Text textColor={"white"}>{data?.me?.username}</Text>
                </Box>
                <Button
                    ml={4}
                    textColor={"white"}
                    variant={"link"}
                    isLoading={logoutFetching}
                    onClick={async () => {
                        await logout();
                        await apollo.resetStore();
                    }}
                >
                    Logout
                </Button>
            </Box>
        );
    }
    return (
        <Flex bg="tan" p={4} alignItems="center">
            <Box>
                <NextLink href="/">
                    <Text
                        fontWeight={800}
                        fontSize={20}
                        color="white"
                        cursor="pointer"
                    >
                        GraphQL Reddit
                    </Text>
                </NextLink>
            </Box>
            <Box ml={"auto"}>{body}</Box>
        </Flex>
    );
};

export default Navbar;
