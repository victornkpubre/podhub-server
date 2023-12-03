import { generateTemplate } from "#/mail/template";
import path from "path";
import { MAILTRAP_PASS, MAILTRAP_USER, PASSWORD_RESET_LINK, SIGN_IN_URL, VERIFICATION_EMAIL } from "./variables";
import nodemailer from 'nodemailer'


const generateMailTransporter = () => {
    return nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: MAILTRAP_USER,
            pass: MAILTRAP_PASS,
        }
    });
}

interface Profile {
    name: string;
    email: string;
    userId: string;
}

export const sendVerificationMail = async (token: string, {name, email, userId}: Profile) => {
    const transport = generateMailTransporter()
    const welcomeMessage = `Hi ${name}, welcome to Podify! There are so much thing that we do for verified users. Use the given OTP to verify your email`;

    console.log(welcomeMessage)
    
    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Welcome Message",
        html: generateTemplate({
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
                path: path.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "welcome.png",
                path: path.join(__dirname, "../mail/welcome.png"),
                cid: "welcome"
            }
        ]
    });

}

interface Options {
    email: string,
    link: string
}

export const sendForgetPasswordMail = async ({email, link}: Options) => {
    const transport = generateMailTransporter()
    const welcomeMessage = `You forgot your password? Use the link below and create brand new password`;

    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Reset Password Link",
        html: generateTemplate({
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
                path: path.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "forget_password.png",
                path: path.join(__dirname, "../mail/forget_password.png"),
                cid: "forget_password"
            }
        ]
    });

}

export const sendPassResetSuccessEmail = async (name: string, email: string) => {
    const transport = generateMailTransporter()
    const welcomeMessage = `${name} we just updated your new password. You can now sign in with your new password`;

    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Password Reset Successfully",
        html: generateTemplate({
            title: "Password Reset Successfully",
            message: welcomeMessage,
            logo: "cid:logo",
            banner: "cid:forget_password",
            link: SIGN_IN_URL,
            btnTitle: "Log in"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path.join(__dirname, "../mail/logo.png"),
                cid: "logo"
            },
            {
                filename: "forget_password.png",
                path: path.join(__dirname, "../mail/forget_password.png"),
                cid: "forget_password"
            }
        ]
    });

}
