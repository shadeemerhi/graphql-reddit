import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";

const ForgotPassword: React.FC<{}> = () => {
    const [submit, { data }] = useForgotPasswordMutation();

    let body = (
        <Formik
            initialValues={{ email: "" }}
            onSubmit={async (values, { setErrors }) => {
                console.log(values);
                const response = await submit({
                    variables: { email: values.email },
                });
                if (!response.data?.forgotPassword) {
                    setErrors({
                        email: "A user with that email does not exist",
                    });
                    return;
                }
            }}
        >
            {({ isSubmitting }) => (
                <Form>
                    <Box mt={4}>
                        <InputField
                            name="email"
                            placeholder="email"
                            label="Email"
                            type="email"
                        />
                    </Box>
                    <Button
                        type="submit"
                        mt={4}
                        colorScheme="teal"
                        isLoading={isSubmitting}
                        color="white"
                    >
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );

    if (data?.forgotPassword) {
        body = <Box>A password reset link has been sent to your email.</Box>;
    }

    return <Wrapper>{body}</Wrapper>;
};

export default ForgotPassword;
