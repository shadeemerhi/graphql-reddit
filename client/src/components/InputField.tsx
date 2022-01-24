import {
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Textarea,
} from "@chakra-ui/react";
import { Form, useField } from "formik";
import React from "react";

type InputFieldProps = React.InputHTMLAttributes<
    HTMLInputElement | HTMLTextAreaElement
> & {
    label?: string;
    name: string;
    textarea?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({
    label,
    textarea,
    size: _,
    ...props
}) => {
    const [field, { error }] = useField(props);

    return (
        <FormControl isInvalid={!!error}>
            {label && <FormLabel htmlFor={field.name}>{label}</FormLabel>}
            {textarea ? (
                <Textarea
                    {...field}
                    {...props}
                    id={field.name}
                    placeholder={props.placeholder}
                    _hover={{ border: "1px solid #1DA1F2" }}
                />
            ) : (
                <Input
                    {...field}
                    {...props}
                    id={field.name}
                    placeholder={props.placeholder}
                />
            )}
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
};

export default InputField;
