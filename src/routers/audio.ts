import { Router } from "express";
import { validate } from "#/middleware/validator";
import { isVerified, mustAuth } from "#/middleware/auth";
import { AudioValidationSchema } from "#/utils/validationSchema";
import { createAudio, getLatestUpload, updateAudio } from "#/controllers/audio";
import fileParser from "#/middleware/fileparser";


const router = Router();

router.post('/create', mustAuth, isVerified, fileParser, validate(AudioValidationSchema), 
    createAudio
);

router.patch(
    "/:audioId",
    mustAuth,
    isVerified,
    fileParser,
    validate(AudioValidationSchema),
    updateAudio
)

router.post('/latest', getLatestUpload)


export default router;