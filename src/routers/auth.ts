import { Router } from "express";
import { validate } from "#/middleware/validator";
import { CreateUserVerification, SignInValidationSchema, TokenAndIDValidation, UpdatePasswordSchema } from "#/utils/validationSchema";
import { LogOut, create, generateForgetPasswordLink, grantValid, sendProfile, sendReVerification, signIn, updatePassword, updateProfile, verifyEmail } from "#/controllers/user";
import { isValidPassResetToken, mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileparser";

const router = Router();

router.post('/create', validate(CreateUserVerification), create)
router.post('/verify-email',validate(TokenAndIDValidation), verifyEmail)
router.post('/resend-verify-email', sendReVerification)
router.post('/forgot-password', generateForgetPasswordLink)
router.post('/verify-password-reset-token', validate(TokenAndIDValidation), isValidPassResetToken, grantValid)
router.post('/update-password', validate(UpdatePasswordSchema), isValidPassResetToken, updatePassword)
router.post('/sign-in', validate(SignInValidationSchema), signIn)
router.get('/is-auth', mustAuth, sendProfile)
router.post('/update-profile', mustAuth, fileParser, updateProfile)
router.post("/log-out", mustAuth, LogOut)

export default router;