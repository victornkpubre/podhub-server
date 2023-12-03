import { getFavorite, getIsFavorite, toggleFavorite } from "#/controllers/favorite";
import { isVerified, mustAuth } from "#/middleware/auth";
import { Router } from "express";


const router = Router();

router.post('/', mustAuth, isVerified, toggleFavorite)
router.get('/', mustAuth, getFavorite)
router.get('/isfav', mustAuth, getIsFavorite)

export default router;