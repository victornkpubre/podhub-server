import { isValidObjectId } from "mongoose";
import * as yup from "yup" 
import { categories } from "./auto_categories";

export const CreateUserVerification = yup.object().shape({
    name: yup
        .string()
        .trim()
        .required("Name is missing")
        .min(3, "Name is too short")
        .max(20, "Name is too long"),
    email: yup
        .string()
        .required("Email is missing")
        .email("Invalid Email"),
    password: yup
        .string()
        .trim()
        .required("Password is missing")
        .min(8, "Password is too short")
        .matches(
            /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
            "Password is too simple!"
        )
});


export const TokenAndIDValidation = yup.object().shape({
    token: yup.string().trim().required("Invalid token"),
    userId: yup
        .string()
        .transform(function (value) {
            if (this.isType(value) && isValidObjectId(value)) {
                return value;
            }
            return "";
        })
        .required("Invalid userId!"),
})

export const UpdatePasswordSchema = yup.object().shape({
    password: yup
        .string()
        .trim()
        .required("Password is missing")
        .min(8, "Password is too short")
        .matches(
            /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
            "Password is too simple!"
        )
});

export const SignInValidationSchema = yup.object().shape({
    email: yup.string().required("Email is missing").email("Invalid email format"),
    password: yup.string().trim().required("Password is missing")
})

export const AudioValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing"),
    category: yup.string()
                 .oneOf(categories, "Invlaid category")
                 .required("Category is missing")
})

export const NewPlaylistValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing"),
    resId: yup.string().transform(function (value) {
        return this.isType(value) && isValidObjectId(value) ? value: ""
    }) ,
    visibility: yup.string()
                 .oneOf(["public", "private"], "Visibility must be public or private")
                //  .required("Visibility is missing")
})

export const UpdateHistorySchema = yup.object().shape({
    audio: yup.string().transform(function (value) {
        return this.isType(value) && isValidObjectId(value) ? value: ""
    }).required("Invlaid audio id!") ,
    progress: yup.number().required("History progress is missing!"),
    date: yup.string().transform(function (value) {
        const date = new Date(value);
        if(date instanceof Date) return value;
        return ""
    }).required("Invlaid date!") ,
})