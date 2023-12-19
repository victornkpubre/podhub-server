import { createPlaylist, getAudios, getPlaylistByProfile, removePlaylist, spotifymigrate, updatePlaylist } from "#/controllers/playlist";
import { isVerified, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { NewPlaylistValidationSchema } from "#/utils/validationSchema";
import { Router } from "express";


const router = Router();

router.post('/create', 
    mustAuth, 
    isVerified, 
    validate(NewPlaylistValidationSchema), 
    createPlaylist
)

router.patch('/', 
    mustAuth,  
    validate(NewPlaylistValidationSchema), 
    updatePlaylist
)

router.delete('/', 
    mustAuth, 
    removePlaylist
)

router.get('/by-profile', 
    mustAuth, 
    getPlaylistByProfile
)

router.get('/:playlistId', 
    mustAuth, 
    getAudios
)

router.post('/spotify-migrate', 
    mustAuth, 
    spotifymigrate
)
export default router;