import { EMAIL, MAILTRAP_TOKEN, PASSWORD_RESET_LINK, VERIFICATION_EMAIL } from "./variables";
import { MailtrapClient } from "mailtrap"

const ENDPOINT = "https://send.api.mailtrap.io/";


interface Profile {
    name: string;
    email: string;
    userId: string;
}

export const sendVerificationMail = async (token: string, {name, email}: Profile) => {
    const welcomeMessage = `Hi ${name}, welcome to PodHub! There are so much thing that we do for verified users. Use the given OTP to verify your email`;

    const ENDPOINT = "https://send.api.mailtrap.io/";
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: VERIFICATION_EMAIL,
        name: "PodHub Verification",
    };
    
    const recipients = [
        {
            email: email,
        }
    ];

    return client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "a15e86e3-d2f6-45b3-8d6c-fbf869c4be44",
        template_variables: {
          "title": "Welcome to PodHub",
          "message": welcomeMessage,
          "btnTitle": token,
          "user_name": name,
          "next_step_link": "Test_Next_step_link",
          "get_started_link": "Test_Get_started_link",
          "onboarding_video_link": "Test_Onboarding_video_link"
        }
      }).catch(error =>  console.log("Mailing Error: "+error))

}

interface Options {
    email: string,
    link: string
}

export const sendForgetPasswordMail = async ({email, link}: Options) => {
    const welcomeMessage = "You forgot your password? Use the link below and create brand new password";
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: EMAIL,
        name: "PodHub Password Reset",
    };

    return client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "c7d6203e-5868-4f64-9d14-3090bf0f4d5d",
        template_variables: {
          "title": "PodHub - Verification Email",
          "message": welcomeMessage,
          "btnTitle": "Forgot Password",
          'link': PASSWORD_RESET_LINK
        }
    }).catch(error =>  console.log("Mailing Error: "+error))

}

export const sendPassResetSuccessEmail = async (name: string, email: string) => {
    const message = `Hi ${name}, You'r password was successfully updated.`;
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: EMAIL,
        name: "PodHub Password Reset",
    };

    return client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "c7d6203e-5868-4f64-9d14-3090bf0f4d5d",
        template_variables: {
          "title": "Password Reset Successfully",
          "message": message,
          "btnTitle": "Login"
        }
    }).catch(error =>  console.log("Mailing Error: "+error))
}
