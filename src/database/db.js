const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost', // O endereço do seu servidor MySQL
    user: 'root', // Nome de usuário do MySQL
    password: 'root', // Senha do MySQL
    database: 'timelearn' // Nome do banco de dados a ser usado
});


module.exports = connection;