import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";

const ChangePassword: NextPage<{ token: string }> = () => {
    const [, changePassword] = useChangePasswordMutation();
    const router = useRouter();
    const [tokenError, setTokenError] = useState("");

    return (
        <Wrapper>
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    console.log(values);
                    setTokenError("");
                    const response = await changePassword({
                        newPassword: values.newPassword,
                        token:
                            typeof router.query.token === "string"
                                ? router.query.token
                                : "",
                    });
                    if (response.data?.changePassword.errors) {
                        const errorMap = toErrorMap(
                            response.data.changePassword.errors
                        );
                        if ("token" in errorMap) {
                            setTokenError(errorMap.token); // error for token
                        }
                        setErrors(errorMap);
                    } else if (response.data?.changePassword.user) {
                        // worked
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Box mt={4}>
                            <InputField
                                name="newPassword"
                                placeholder="New password"
                                label="New Password"
                                type="password"
                            />
                        </Box>
                        {tokenError && (
                            <Box>
                                <Box color={"red"}>{tokenError}</Box>
                                <Link href="/forgot-password">
                                    Reset Password
                                </Link>
                            </Box>
                        )}
                        <Button
                            type="submit"
                            mt={4}
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            color="white"
                        >
                            Change Password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ChangePassword);
