const jwt = require('jsonwebtoken');

// 1. Verifica se o Token é válido
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // O token vem no formato "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Injeta os dados do usuário na requisição
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

// 2. Verifica se o usuário tem o cargo necessário (Role Based Access Control)
exports.authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        // allowedRoles pode ser uma string 'ADMIN' ou array ['ADMIN', 'MANAGER']
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!req.user || !rolesArray.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Acesso proibido. Seu perfil (${req.user?.role}) não tem permissão.` 
            });
        }
        next();
    };
};