import { Box, Button, Flex, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

const Navbar: React.FC<NavBarProps> = () => {
    const [{ fetching, error, data }] = useMeQuery();
    console.log("HERE IS DATA", fetching, data);

    let body = null;

    // data is loading
    if (fetching) {
    }
    // user not logged in
    else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link color={"white"} mr={4}>
                        Login
                    </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color={"white"}>Register</Link>
                </NextLink>
            </>
        );
    }
    // user is logged in
    else {
        body = (
            <Box display={"flex"} alignItems={"center"}>
                <Box>
                    <Text textColor={"white"}>{data?.me?.username}</Text>
                </Box>
                <Button ml={4} textColor={"white"} variant={"link"}>
                    Logout
                </Button>
            </Box>
        );
    }
    return (
        <Flex bg="tan" p={4}>
            <Box ml={"auto"}>{body}</Box>
        </Flex>
    );
};

export default Navbar;
