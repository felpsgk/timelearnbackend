const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const connection = require('./database/db');
const cors = require('cors');
const routes = express.Router();
const tipoUsers = require('./api/tipo_user');

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3001"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  key: "userId",
  secret: "subscribe",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 60000 * 60
  },
}));

const jwt = require('jsonwebtoken');
const secretKey = 'suaChaveSecreta'; // Substitua por uma chave secreta forte


app.use(bodyParser.json());
app.use(routes);
app.use('/api', tipoUsers);

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados MySQL:', err);
  } else {
    console.log('Conexão com o banco de dados MySQL bem-sucedida');
  }
});

// Verifico token
function verifyToken(req, res, next) {
  const token = req.headers.authorization; // Geralmente, o token JWT é enviado no cabeçalho de autorização
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // O token é válido; você pode acessar os dados do usuário decodificados
    req.user = decoded;
    next();
  });
}
// Cadastro usuarios
app.post('/cadastrar', (req, res) => {
  const { nome, email, password, tipo_usuario_id } = req.body;
  // valida email
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(checkEmailQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Erro ao consultar o banco de dados:', checkErr);
      res.status(500).json({ message: 'Erro interno do servidor' });
      return;
    }
    if (checkResults.length > 0) {
      res.status(400).json({ message: 'Email já está em uso' });
      return;
    }

    // Se o email não estiver em uso, insere usuario com senha hasheada
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Erro ao criar hash da senha:', hashErr);
        res.status(500).json({ message: 'Erro interno do servidor' });
        return;
      }
      // SQL para inserir o novo usuário
      const insertUserQuery = 
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)';
      connection.query(insertUserQuery, [nome, email, hashedPassword], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Erro ao inserir o usuário no banco de dados:', insertErr);
          res.status(500).json({ message: 'Erro interno do servidor' });
          return;
        }
        // se usuario inserido, retorna 201 para login
        res.status(201).json({ message: 'Cadastro realizado com sucesso' });
      });
    });
  });
});

// Verifico se logou
app.get('/login', verifyToken, (req, res) => {
  res.json({ nome: req.user.nome, message: 'Acesso autorizado' });
});
// faço login
app.post('/login', (req, res) => {
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
      res.status(401).json({ message: 'Credenciais inválidas' });
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
        const userData = {
          id: user.id, // ID do usuário
          nome: user.nome, // Nome de usuário
        };
        const token = jwt.sign(userData, secretKey, { expiresIn: '1h' });
        res.status(200).json({ token });
      } else {
        // Senha não corresponde
        res.status(401).json({ message: 'credenciais inválidas' });
      }
    });
  });
});

// Rota para efetuar logout
app.get('/logout', (req, res) => {
  console.log("logout");
  req.session.destroy();
  req.session.destroy(function (err) {
    console.log("logout err" + err); //Inside a callback… bulletproof!
  });
})


module.exports = routes;

app.get('/', (req, res) => {
  res.send('FALA NARUTEIRO')
})

app.listen(3000, () => {
  console.log('server iniciado em 3000');
});