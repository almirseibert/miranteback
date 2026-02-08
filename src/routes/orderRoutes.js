const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, authorizeRole(['WAITER', 'ADMIN', 'MANAGER']), orderController.createOrder);
router.get('/kds/:destination', verifyToken, orderController.getKDSOrders);
router.patch('/item/:itemId', verifyToken, orderController.updateItemStatus);

module.exports = router;