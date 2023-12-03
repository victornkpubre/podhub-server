"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHistorySchema = exports.NewPlaylistValidationSchema = exports.AudioValidationSchema = exports.SignInValidationSchema = exports.UpdatePasswordSchema = exports.TokenAndIDValidation = exports.CreateUserVerification = void 0;
const mongoose_1 = require("mongoose");
const yup = __importStar(require("yup"));
const auto_categories_1 = require("./auto_categories");
exports.CreateUserVerification = yup.object().shape({
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
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/, "Password is too simple!")
});
exports.TokenAndIDValidation = yup.object().shape({
    token: yup.string().trim().required("Invalid token"),
    userId: yup
        .string()
        .transform(function (value) {
        if (this.isType(value) && (0, mongoose_1.isValidObjectId)(value)) {
            return value;
        }
        return "";
    })
        .required("Invalid userId!"),
});
exports.UpdatePasswordSchema = yup.object().shape({
    password: yup
        .string()
        .trim()
        .required("Password is missing")
        .min(8, "Password is too short")
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/, "Password is too simple!")
});
exports.SignInValidationSchema = yup.object().shape({
    email: yup.string().required("Email is missing").email("Invalid email format"),
    password: yup.string().trim().required("Password is missing")
});
exports.AudioValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing"),
    about: yup.string().required("About is missing"),
    category: yup.string()
        .oneOf(auto_categories_1.categories, "Invlaid category")
        .required("Category is missing")
});
exports.NewPlaylistValidationSchema = yup.object().shape({
    title: yup.string().required("Title is missing"),
    resId: yup.string().transform(function (value) {
        return this.isType(value) && (0, mongoose_1.isValidObjectId)(value) ? value : "";
    }),
    visibility: yup.string()
        .oneOf(["public", "private"], "Visibility must be public or private")
});
exports.UpdateHistorySchema = yup.object().shape({
    audio: yup.string().transform(function (value) {
        return this.isType(value) && (0, mongoose_1.isValidObjectId)(value) ? value : "";
    }).required("Invlaid audio id!"),
    progress: yup.number().required("History progress is missing!"),
    date: yup.string().transform(function (value) {
        const date = new Date(value);
        if (date instanceof Date)
            return value;
        return "";
    }).required("Invlaid date!"),
});
