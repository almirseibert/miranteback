const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,      // <--- Deve vir da variável
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Usa 3306 se não tiver porta definida
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Log para debug (aparecerá no console do Easypanel para conferirmos)
console.log(`Tentando conectar ao MySQL em: ${process.env.DB_HOST || 'HOST NÃO DEFINIDO'}`);

pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL Conectado com Sucesso!');
        connection.release();
    })
    .catch(err => {
        console.error(`❌ Erro Fatal MySQL: ${err.message}`);
        // Não mate o processo aqui, deixe o Easypanel tentar reiniciar se necessário
    });

module.exports = pool;