// src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importação das Rotas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');

// Inicialização do App e Servidor HTTP
const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restrinja ao domínio do frontend
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Middlewares Globais
app.use(helmet()); // Segurança HTTP headers
app.use(morgan('combined')); // Logs detalhados
app.use(cors()); // Permite conexões de outras origens
app.use(express.json()); // Parse de JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Parse de formulários

// Middleware para Injeção do Socket.IO nas requisições
// Isso permite usar 'req.io.emit' dentro dos controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Definição das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);

// Rota de Health Check (Para o Easypanel monitorar)
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'online', 
        service: 'Mirante Gastro Pub Backend',
        version: '1.0.0'
    });
});

// Configuração dos Eventos do Socket.IO
io.on('connection', (socket) => {
    console.log(`⚡ Cliente conectado via Socket: ${socket.id}`);

    // Garçom entra na sala 'waiters' para receber avisos de "Prato Pronto"
    socket.on('join_waiters', () => {
        socket.join('waiters');
        console.log(`Socket ${socket.id} entrou na sala: waiters`);
    });

    // Cozinha entra na sala 'kitchen' para receber novos pedidos
    socket.on('join_kitchen', () => {
        socket.join('kitchen');
        console.log(`Socket ${socket.id} entrou na sala: kitchen`);
    });

    // Bar entra na sala 'bar'
    socket.on('join_bar', () => {
        socket.join('bar');
        console.log(`Socket ${socket.id} entrou na sala: bar`);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

// Tratamento Global de Erros (Evita que o servidor caia)
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: err.message 
    });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Mirante rodando na porta ${PORT}`);
    console.log(`📡 Socket.IO pronto para conexões em tempo real`);
});