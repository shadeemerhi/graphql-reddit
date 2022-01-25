import {
    Alert,
    AlertDescription,
    AlertIcon,
    Box,
    Button,
    CloseButton,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { useIsAuth } from "../utils/useIsAuth";
import { withApollo } from "../utils/withApollo";

const CreatePost: React.FC<{}> = () => {
    const router = useRouter();
    useIsAuth();
    const [createPost, { error }] = useCreatePostMutation();

    return (
        <Layout variant="small">
            {error && (
                <Alert status="error">
                    <AlertIcon />
                    <AlertDescription>
                        Error creating post. Try again later.
                    </AlertDescription>
                    <CloseButton position="absolute" right="8px" top="8px" />
                </Alert>
            )}
            <Formik
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values, { setErrors }) => {
                    console.log(values);
                    // Could maybe do some better error handling here
                    const { errors } = await createPost({
                        variables: { input: values },
                        update: (cache) => {
                            cache.evict({ fieldName: "posts" });
                        },
                    });

                    // Global error handler will handle any errors here
                    if (!errors) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="Title"
                            label="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                name="text"
                                placeholder="What would you like to say?"
                                label="Body"
                                textarea
                            />
                        </Box>
                        <Button
                            type="submit"
                            mt={4}
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            color="white"
                        >
                            Create Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withApollo({ ssr: false })(CreatePost);
