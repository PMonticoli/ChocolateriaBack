const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(cors());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// RUTAS
const usuarioRoute = require('./api/routes/usuario');
app.use('/usuarios',usuarioRoute);

const productoRoute = require('./api/routes/producto');
app.use('/productos',productoRoute);

const pedidoRoute = require('./api/routes/pedido');
app.use('/pedidos',pedidoRoute);

const estadoPedidoRoute = require('./api/routes/estadoPedido');
app.use('/estadosPedido',estadoPedidoRoute);

const tiposPagosRoute = require('./api/routes/tipoPago');
app.use('/tiposPago',tiposPagosRoute);

const cobroRoute = require('./api/routes/cobro');
app.use('/cobros', cobroRoute);

const socioRoute = require('./api/routes/socio');
app.use('/socios',socioRoute);

const promocionRoute = require('./api/routes/promocion');
app.use('/promociones', promocionRoute);

module.exports = app;