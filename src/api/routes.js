const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const connection = require('../database/db');

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
    } else {
        console.log('Conexão com o banco de dados MySQL bem-sucedida');
    }
});

const routes = express.Router();

routes.get('/auth-check',(req,res) => {
    console.log(req.session.user);
    if(req.session.user){
        res.json({isAutenticado:true,user:req.session.user})
    } else {
        res.json({isAutenticado:false})
    } 
});

routes.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    // Consulta SQL para buscar o usuário pelo email
    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Erro ao consultar o banco de dados:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
        return;
      }
      if (results.length === 0) {
        res.status(401).json({ message: 'Credenciais inválidaaaaaas' });
        return;
      }
      const user = results[0];
      
      // Comparar a senha fornecida com a senha armazenada usando bcrypt
      bcrypt.compare(password, user.senha, (bcryptErr, isMatch) => {
        if (bcryptErr) {
          console.error('Erro ao comparar senhas:', bcryptErr);
          res.status(500).json({ message: 'Erro interno do servidor' });
          return;
        }
  
        if (isMatch) {
          // Senha correspondente
          req.session.user = user;
          res.status(200).json({ message: `Usuário ${user.nome} conectado` });
        } else {
          // Senha não corresponde
          res.status(401).json({ message: 'Credenciais inválidassssss' });
        }
      });
    });
  });

module.exports = routes;