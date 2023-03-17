const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(cors());

// RUTAS
const usuarioRoute = require('./api/routes/usuario');
app.use('/usuarios',usuarioRoute);


module.exports = app;