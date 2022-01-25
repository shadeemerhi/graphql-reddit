import { useApolloClient } from "@apollo/client";
import { Box, Button, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

interface LoginProps {}

const Login: React.FC<LoginProps> = ({}) => {
    const router = useRouter();
    const apollo = useApolloClient();
    const [login] = useLoginMutation();

    return (
        <Layout>
            <Formik
                initialValues={{ usernameOrEmail: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    console.log(values);
                    const response = await login({
                        variables: values,
                        update: (cache, { data }) => {
                            cache.writeQuery<MeQuery>({
                                query: MeDocument,
                                data: {
                                    me: data?.login.user,
                                },
                            });
                        },
                    });
                    console.log("====================================");
                    console.log("HERE IS RESPOSNE", response);
                    console.log("====================================");
                    if (response.data?.login.errors) {
                        setErrors(toErrorMap(response.data.login.errors));
                    } else if (response.data?.login.user) {
                        // worked
                        let redirectPath = "/";
                        if (typeof router.query.next === "string") {
                            redirectPath = router.query.next;
                        }
                        router.push(redirectPath);
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="usernameOrEmail"
                            placeholder="Username or email"
                            label="Username or email"
                        />
                        <Box mt={4}>
                            <InputField
                                name="password"
                                placeholder="password"
                                label="Password"
                                type="password"
                            />
                        </Box>
                        <Button
                            type="submit"
                            mt={4}
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            color="white"
                        >
                            Login
                        </Button>
                        <Box mt={4}>
                            <NextLink href="/forgot-password">
                                <Link>Forgot Password?</Link>
                            </NextLink>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withApollo({ ssr: false })(Login);
