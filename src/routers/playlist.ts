import { createPlaylist, getAudios, getPlaylistByProfile, removePlaylist, spotifysearch, spotifysearch2, updatePlaylist } from "#/controllers/playlist";
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

router.get('/spotify-search/:accessToken', 
    spotifysearch
)

router.post('/spotify-search-2/:accessToken', 
    spotifysearch2
)
export default router;