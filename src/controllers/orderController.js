const db = require('../config/db');

// Criar Pedido (Garçom)
exports.createOrder = async (req, res) => {
    const { table_id, items, customer_name } = req.body; 
    // items = [{ product_id: 1, quantity: 2, notes: 'Sem gelo' }, ...]
    const userId = req.user.id; // Vem do Token

    const connection = await db.getConnection(); // Transação para garantir integridade
    await connection.beginTransaction();

    try {
        // 1. Criar o cabeçalho do pedido
        const [orderResult] = await connection.query(
            'INSERT INTO orders (table_id, user_id, customer_name, status) VALUES (?, ?, ?, "OPEN")',
            [table_id, userId, customer_name]
        );
        const orderId = orderResult.insertId;

        // 2. Inserir itens e preparar notificações
        const itemsToNotify = [];

        for (const item of items) {
            // Buscar preço atual e destino (Cozinha/Bar)
            const [prod] = await connection.query('SELECT price, destination, name FROM products WHERE id = ?', [item.product_id]);
            const product = prod[0];

            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes, status) VALUES (?, ?, ?, ?, ?, ?, "PENDING")',
                [orderId, item.product_id, item.quantity, product.price, (product.price * item.quantity), item.notes]
            );

            itemsToNotify.push({ 
                ...item, 
                order_id: orderId, 
                destination: product.destination,
                product_name: product.name,
                table_id 
            });
        }

        // 3. Atualizar status da mesa para "Ocupada"
        await connection.query('UPDATE tables SET status = "OCCUPIED" WHERE id = ?', [table_id]);

        await connection.commit();

        // 4. DISPARAR SOCKETS (A mágica acontece aqui)
        // Filtra itens por destino e envia para salas específicas
        const kitchenItems = itemsToNotify.filter(i => i.destination === 'KITCHEN');
        const barItems = itemsToNotify.filter(i => i.destination === 'BAR');

        if (kitchenItems.length > 0) req.io.to('kitchen').emit('new_kds_order', { orderId, table_id, items: kitchenItems });
        if (barItems.length > 0) req.io.to('bar').emit('new_bar_order', { orderId, table_id, items: barItems });
        
        req.io.emit('table_updated'); // Atualiza mapa de mesas para todos

        res.status(201).json({ message: 'Pedido enviado!', orderId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar pedido' });
    } finally {
        connection.release();
    }
};

// Listar Pedidos Pendentes (Para telas de Cozinha/Bar)
exports.getKDSOrders = async (req, res) => {
    const { destination } = req.params; // 'KITCHEN' ou 'BAR'
    try {
        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name, o.table_id, o.created_at, o.customer_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE p.destination = ? AND oi.status IN ('PENDING', 'PREPARING')
            ORDER BY o.created_at ASC
        `, [destination]);
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar KDS' });
    }
};

// Atualizar Status do Item (Cozinha avisa que está pronto)
exports.updateItemStatus = async (req, res) => {
    const { itemId } = req.params;
    const { status } = req.body; // 'READY', 'DELIVERED'

    try {
        await db.query('UPDATE order_items SET status = ? WHERE id = ?', [status, itemId]);
        
        // Se estiver PRONTO, avisa o garçom
        if (status === 'READY') {
            const [itemData] = await db.query('SELECT order_id, product_id FROM order_items WHERE id = ?', [itemId]);
            const [orderData] = await db.query('SELECT user_id, table_id FROM orders WHERE id = ?', [itemData[0].order_id]);
            
            // Notifica especificamente os garçons
            req.io.to('waiters').emit('item_ready', { 
                table: orderData[0].table_id, 
                item: itemId 
            });
        }

        res.json({ message: 'Status atualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
};