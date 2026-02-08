const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,      // Vai pegar 'sites_mirante'
    port: process.env.DB_PORT,      // Vai pegar '3306'
    user: process.env.DB_USER,      // 'mirante'
    password: process.env.DB_PASSWORD, // A senha fornecida
    database: process.env.DB_NAME,  // 'mirante'
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4' // Importante para emojis 🍔
});

// Teste de conexão silencioso (para não poluir logs de produção, mas útil para debug)
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ MySQL Conectado em: ${process.env.DB_HOST}`);
        connection.release();
    } catch (err) {
        console.error('❌ Falha na conexão MySQL:', err.message);
    }
})();

module.exports = pool;