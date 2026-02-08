const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Rota Pública: Login
router.post('/login', authController.login);

// Rota Protegida: Validar sessão atual (Recarregar F5)
router.get('/me', verifyToken, authController.me);

module.exports = router;