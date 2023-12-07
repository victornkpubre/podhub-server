const {env} = process as {env: {[key: string]: string}}

export const {
    MONGO_URI,
    VERIFICATION_EMAIL,
    PASSWORD_RESET_LINK,
    JWT_SECRET,
    CLOUD_NAME,
    CLOUD_KEY,
    CLOUD_SECRET,
    MAILTRAP_TOKEN,
    EMAIL
} = env;