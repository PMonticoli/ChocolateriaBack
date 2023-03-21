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

const productoRoute = require('./api/routes/producto');
app.use('/productos',productoRoute);

const pedidoRoute = require('./api/routes/pedido');
app.use('/pedidos',pedidoRoute);

const estadoPedidoRoute = require('./api/routes/estadoPedido');
app.use('/estadosPedido',estadoPedidoRoute);

module.exports = app;