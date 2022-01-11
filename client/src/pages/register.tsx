// import React from "react";
import {
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Button,
} from "@chakra-ui/react";
import { Formik, Form } from "formik";
import Wrapper from "../components/Wrapper";

interface RegisterProps {}

const Register: React.FC<RegisterProps> = ({}) => {
    return (
        <Wrapper>
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={(values) => {
                    console.log(values);
                }}
            >
                {({ values, handleChange }) => (
                    <Form>
                        <FormControl>
                            <FormLabel htmlFor="username">Username</FormLabel>
                            <Input
                                value={values.username}
                                onChange={handleChange}
                                id="username"
                                placeholder="username"
                            />
                            {/* <FormErrorMessage>{form.errors.name}</FormErrorMessage> */}
                        </FormControl>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default Register;
