const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    try {
        // 1. Busca o usuário no banco (incluindo a senha hash)
        const [rows] = await db.execute(
            'SELECT id, name, username, password_hash, role, active FROM users WHERE username = ?',
            [username]
        );

        const user = rows[0];

        // 2. Verificações de segurança
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.active) {
            return res.status(403).json({ error: 'Usuário desativado. Contate o gerente.' });
        }

        // 3. Comparar a senha enviada com o Hash do banco
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // 4. Gerar o Token JWT
        // O token carrega o ID e o ROLE, permitindo validações rápidas no front e back
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role, 
                name: user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' } // Dura um turno de trabalho
        );

        // 5. Retorna dados limpos (sem a senha)
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login' });
    }
};

// Rota auxiliar para verificar se o token ainda é válido (ao recarregar a página)
exports.me = async (req, res) => {
    // O middleware já colocou o usuário no req.user
    res.json({ user: req.user });
};