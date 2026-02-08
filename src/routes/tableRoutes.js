const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, tableController.getTables);
router.post('/close', verifyToken, authorizeRole(['CASHIER', 'ADMIN', 'MANAGER']), tableController.closeAccount);

module.exports = router;