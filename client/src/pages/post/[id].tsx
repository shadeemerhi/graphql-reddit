import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useRouter } from "next/router";
import { useMeQuery, usePostQuery, useUpdatePostMutation } from "../../generated/graphql";
import Layout from "../../components/Layout";
import { Alert, AlertDescription, AlertIcon, Box, Button, CloseButton, FormControl, Heading, Textarea } from "@chakra-ui/react";
import { Field, Form, Formik, useField } from "formik";
import { EditIcon } from "@chakra-ui/icons";
import InputField from "../../components/InputField";

const Post: React.FC<{}> = () => {
    const router = useRouter();
    const { id } = router.query;

    const [editing, setEditing] = useState(false);

    const intId = typeof id === "string" ? parseInt(id) : -1;

    const [{ data, fetching, error }, _] = usePostQuery({
        pause: intId === -1, // bad URL parameter
        variables: {
            id: intId,
        },
    });

    const [{ data: meData }] = useMeQuery();
    const [{ error: updateError }, updatePost] = useUpdatePostMutation();

    if (fetching) {
        return <Layout>LOADING</Layout>;
    }

    if (!data?.post) {
        return (
            <Layout>
                <Box>Could not find post</Box>
            </Layout>
        );
    }

    return (
        <Layout>
            {updateError && (
                <Alert status="error">
                    <AlertIcon />
                    <AlertDescription>
                       Error editing post. Please try again later.
                    </AlertDescription>
                    <CloseButton position="absolute" right="8px" top="8px" />
                </Alert>
            )}
            <Box>
                {editing ? (
                    <Formik
                        initialValues={{
                            title: data.post.title,
                            text: data.post.text,
                        }}
                        onSubmit={async (values) => {
                            const { title, text } = values;
                            await updatePost({
                                id: data.post!.id,
                                title,
                                text
                            });

                            setEditing(false);

                        }}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <FormControl>
                                    <InputField name="title" label="Title" />
                                    <br />
                                    <InputField
                                        name="text"
                                        textarea
                                        label="Body"
                                    />
                                    <Box display="flex" justifyContent="center">
                                        <Button
                                            type="submit"
                                            colorScheme="teal"
                                            color="white"
                                            isLoading={isSubmitting}
                                            mt={4}
                                        >
                                            Save
                                        </Button>
                                    </Box>
                                </FormControl>
                            </Form>
                        )}
                    </Formik>
                ) : (
                    <>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={4}
                        >
                            <Heading>{data?.post?.title}</Heading>
                            {meData?.me?.id === data.post.creatorId && (
                                <EditIcon
                                    fontSize={20}
                                    cursor="pointer"
                                    onClick={() => setEditing(true)}
                                />
                            )}
                        </Box>
                        {data.post.text}
                    </>
                )}
            </Box>
        </Layout>
    );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
