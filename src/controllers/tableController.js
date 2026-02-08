const db = require('../config/db');

// Listar Mesas (Status atual)
exports.getTables = async (req, res) => {
    try {
        // Pega mesa + total atual da conta (se houver pedido aberto)
        const [tables] = await db.query(`
            SELECT t.*, 
            (SELECT SUM(oi.subtotal) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.table_id = t.id AND o.status = 'OPEN') as current_total
            FROM tables t
        `);
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar mesas' });
    }
};

// Fechar Conta (Caixa)
exports.closeAccount = async (req, res) => {
    const { table_id, payment_method, discount } = req.body;
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Busca pedido aberto da mesa
        const [orders] = await connection.query('SELECT id, total_amount FROM orders WHERE table_id = ? AND status = "OPEN"', [table_id]);
        
        if (orders.length === 0) return res.status(400).json({ error: 'Nenhum pedido aberto nesta mesa' });
        
        const orderId = orders[0].id;

        // Atualiza Pedido para PAGO
        await connection.query('UPDATE orders SET status = "PAID", closed_at = NOW() WHERE id = ?', [orderId]);
        
        // Libera a Mesa
        await connection.query('UPDATE tables SET status = "AVAILABLE" WHERE id = ?', [table_id]);

        // Registra Pagamento (Simplificado aqui)
        await connection.query('INSERT INTO payments (order_id, payment_method, amount) VALUES (?, ?, ?)', 
            [orderId, payment_method, orders[0].total_amount - (discount || 0)]);

        await connection.commit();

        req.io.emit('table_updated'); // Mesa ficou verde de novo no mapa

        res.json({ message: 'Conta fechada e mesa liberada' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Erro ao fechar conta' });
    } finally {
        connection.release();
    }
};