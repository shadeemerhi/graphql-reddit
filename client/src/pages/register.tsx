import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import InputField from "../components/InputField";
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
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="username"
                            placeholder="username"
                            label="Username"
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
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default Register;
