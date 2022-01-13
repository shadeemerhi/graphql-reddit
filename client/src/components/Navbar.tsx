import { Box, Flex, Link } from "@chakra-ui/react";
import NextLink from 'next/link';

interface NavBarProps {}

const Navbar: React.FC<NavBarProps> = () => {
    return (
        <Flex bg="tomato" p={4}>
            <Box ml={"auto"}>
                <Box ml={"auto"}>
                    <NextLink href="/login">
                        <Link color={"white"} mr={4}>
                            Login
                        </Link>
                    </NextLink>
                    <NextLink href='/register'>
                        <Link color={"white"}>Register</Link>
                    </NextLink>
                </Box>
            </Box>
        </Flex>
    );
};

export default Navbar;
