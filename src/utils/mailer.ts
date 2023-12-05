import { EMAIL, MAILTRAP_TOKEN, PASSWORD_RESET_LINK, VERIFICATION_EMAIL } from "./variables";
import { MailtrapClient } from "mailtrap"

const ENDPOINT = "https://send.api.mailtrap.io/";


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
    const welcomeMessage = "You forgot your password? Use the link below and create brand new password";
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: EMAIL,
        name: "Podify Password Reset",
    };

    client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "c7d6203e-5868-4f64-9d14-3090bf0f4d5d",
        template_variables: {
          "title": "Podify - Verification Email",
          "message": welcomeMessage,
          "btnTitle": "Forgot Password",
          'link': PASSWORD_RESET_LINK
        }
    })

}

export const sendPassResetSuccessEmail = async (name: string, email: string) => {
    const message = `Hi ${name}, You'r password was successfully updated.`;
    const client = new MailtrapClient({ endpoint: ENDPOINT, token: MAILTRAP_TOKEN});

    const sender = {
        email: EMAIL,
        name: "Podify Password Reset",
    };

    client.send({
        from: sender,
        to: [{email: email}],
        template_uuid: "c7d6203e-5868-4f64-9d14-3090bf0f4d5d",
        template_variables: {
          "title": "Password Reset Successfully",
          "message": message,
          "btnTitle": "Login"
        }
    })
}
