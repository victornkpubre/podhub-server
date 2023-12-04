import { generateTemplate } from "#/mail/template";
import path from "path";
import { MAILTRAP_PASS, MAILTRAP_TOKEN, MAILTRAP_USER, PASSWORD_RESET_LINK, SIGN_IN_URL, VERIFICATION_EMAIL } from "./variables";
import nodemailer from 'nodemailer'
import { MailtrapClient } from "mailtrap"
import fs from "fs"

const ENDPOINT = "https://send.api.mailtrap.io/";


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

export const sendVerificationMail = async (token: string, {name, email}: Profile) => {
    // const transport = generateMailTransporter()
    const welcomeMessage = `Hi ${name}, welcome to Podify! There are so much thing that we do for verified users. Use the given OTP to verify your email`;
    // const welcomeImage = fs.readFileSync(path.join(__dirname, "../mail/welcome.png"));
    // const logoImage = fs.readFileSync(path.join(__dirname, "../mail/logo.png"))
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: VERIFICATION_EMAIL,
        name: "Podify Verification",
    };
    const recipients = [
        {
            email: "victornkpubre@gmail.com",
        }
    ];

    // client.send({
    //     from: sender,
    //     to: recipients,
    //     subject: "Podify - Verification Email",
    //     html: generateTemplate({
    //         title: "Welcome to Podify",
    //         message: welcomeMessage,
    //         logo: "cid:logo",
    //         banner: "cid:welcome",
    //         link: "#",
    //         btnTitle: token
    //     }),
    //     category: "Verification Mail",
    //     attachments: [
    //         {
    //             filename: "welcome.png",
    //             content_id: "welcome",
    //             disposition: "inline",
    //             content: welcomeImage,
    //             type: 'image/png'
    //         },
    //         {
    //             filename: "logo.png",
    //             content_id: "logo",
    //             disposition: "inline",
    //             content: logoImage,
    //             type: 'image/png'
    //         },
    //     ]
    // })

    client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "a15e86e3-d2f6-45b3-8d6c-fbf869c4be44",
        template_variables: {
          "title": "Welcome to Podify",
          "message": welcomeMessage,
          "btnTitle": token,
          "user_name": name,
          "next_step_link": "Test_Next_step_link",
          "get_started_link": "Test_Get_started_link",
          "onboarding_video_link": "Test_Onboarding_video_link"
        }
      })

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
