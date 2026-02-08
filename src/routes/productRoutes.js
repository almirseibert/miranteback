const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

// Público (Garçons e Cozinha precisam ver o menu)
router.get('/', verifyToken, productController.getMenu);

// Gestão (Só Gerente/Admin)
router.post('/', verifyToken, authorizeRole(['ADMIN', 'MANAGER']), productController.createProduct);
router.patch('/:id/toggle', verifyToken, authorizeRole(['ADMIN', 'MANAGER', 'KITCHEN', 'BAR']), productController.toggleAvailability); 
// Nota: Deixei Cozinha/Bar pausar itens também (ex: acabou o limão, barman pausa a caipirinha).

module.exports = router;