const db = require('../config/db');

// Listar cardápio (Agrupado por categorias para facilitar o front)
exports.getMenu = async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_available = TRUE ORDER BY c.display_order, p.name'
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cardápio' });
    }
};

// Criar Produto (Admin/Gerente)
exports.createProduct = async (req, res) => {
    const { category_id, name, description, price, destination, track_stock } = req.body;
    // Em produção, aqui você pegaria o req.file.filename do Multer para a imagem
    const image_url = req.file ? `/uploads/${req.file.filename}` : null; 

    try {
        const [result] = await db.query(
            'INSERT INTO products (category_id, name, description, price, destination, track_stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [category_id, name, description, price, destination, track_stock, image_url]
        );
        
        // Avisar a todos que o cardápio mudou (ex: novos pratos)
        req.io.emit('menu_updated'); 
        
        res.status(201).json({ message: 'Produto criado!', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

// Pausar Venda (Quando acaba o estoque na cozinha)
exports.toggleAvailability = async (req, res) => {
    const { id } = req.params;
    try {
        // Inverte o status atual
        await db.query('UPDATE products SET is_available = NOT is_available WHERE id = ?', [id]);
        
        // O Socket avisa os garçons IMEDIATAMENTE para bloquear o botão
        const [updated] = await db.query('SELECT id, is_available FROM products WHERE id = ?', [id]);
        req.io.emit('product_availability_changed', updated[0]);
        
        res.json({ message: 'Disponibilidade atualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
    }
};