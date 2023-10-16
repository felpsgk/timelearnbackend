const express = require('express');
const router = express.Router();
const connection = require('../database/db');
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
    } else {
        console.log('Conexão com o banco de dados MySQL bem-sucedida');
    }
});
router.get('/tipo_users', (req, res) => {
    const query = 'SELECT * FROM tipo_usuario';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar tipos de usuário no banco de dados:', err);
            res.status(500).json({ message: 'Erro interno do servidor' });
            return;
        }
        const tiposUsuarios = results.map(row => ({
            id: row.id,
            tipo_usuario: row.tipo_usuario
        }));
        // Envie a lista de tipos de usuários como resposta
        res.json(tiposUsuarios);
    });
});

module.exports = router;