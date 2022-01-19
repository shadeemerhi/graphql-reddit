import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import router from 'next/router';
import React from 'react';
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';
import { toErrorMap } from '../utils/toErrorMap';
import register from './register';

const ForgotPassword:React.FC<{}> = () => {
  
  return (
      <Wrapper>
          <Formik
              initialValues={{ email: "", username: "", password: "" }}
              onSubmit={async (values, { setErrors }) => {
                  // console.log(values);
                  // const response = await register({ options: values });
                  // if (response.data?.register.errors) {
                  //     setErrors(toErrorMap(response.data.register.errors));
                  // } else if (response.data?.register.user) {
                  //     // worked
                  //     router.push("/");
                  // }
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
      </Wrapper>
  );
}

export default ForgotPassword;