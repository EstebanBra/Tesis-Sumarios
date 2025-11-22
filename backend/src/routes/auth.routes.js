import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', verifyToken, me)

export default router
