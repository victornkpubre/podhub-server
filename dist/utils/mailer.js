"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPassResetSuccessEmail = exports.sendForgetPasswordMail = exports.sendVerificationMail = void 0;
const template_1 = require("../mail/template");
const path_1 = __importDefault(require("path"));
const variables_1 = require("./variables");
const nodemailer_1 = __importDefault(require("nodemailer"));
const generateMailTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: variables_1.MAILTRAP_USER,
            pass: variables_1.MAILTRAP_PASS,
        }
    });
};
const sendVerificationMail = (token, { name, email, userId }) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const welcomeMessage = `Hi ${name}, welcome to Podify! There are so much thing that we do for verified users. Use the given OTP to verify your email`;
    console.log(welcomeMessage);
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Welcome Message",
        html: (0, template_1.generateTemplate)({
            title: "Welcome to Podify",
            message: welcomeMessage,
            logo: "cid:logo",
            banner: "cid:welcome",
            link: "#",
            btnTitle: token
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path_1.default.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "welcome.png",
                path: path_1.default.join(__dirname, "../mail/welcome.png"),
                cid: "welcome"
            }
        ]
    });
});
exports.sendVerificationMail = sendVerificationMail;
const sendForgetPasswordMail = ({ email, link }) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const welcomeMessage = `You forgot your password? Use the link below and create brand new password`;
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Reset Password Link",
        html: (0, template_1.generateTemplate)({
            title: "Forgot Password",
            message: welcomeMessage,
            logo: "cid:logo",
            banner: "cid:forget_password",
            link,
            btnTitle: "Forgot Password"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path_1.default.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "forget_password.png",
                path: path_1.default.join(__dirname, "../mail/forget_password.png"),
                cid: "forget_password"
            }
        ]
    });
});
exports.sendForgetPasswordMail = sendForgetPasswordMail;
const sendPassResetSuccessEmail = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const welcomeMessage = `${name} we just updated your new password. You can now sign in with your new password`;
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Password Reset Successfully",
        html: (0, template_1.generateTemplate)({
            title: "Password Reset Successfully",
            message: welcomeMessage,
            logo: "cid:logo",
            banner: "cid:forget_password",
            link: variables_1.SIGN_IN_URL,
            btnTitle: "Log in"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path_1.default.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "forget_password.png",
                path: path_1.default.join(__dirname, "../mail/forget_password.png"),
                cid: "forget_password"
            }
        ]
    });
});
exports.sendPassResetSuccessEmail = sendPassResetSuccessEmail;
