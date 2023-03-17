const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/', [authJwt.verifyToken, authJwt.invalidTokenCheck], async (req, res) => {
    let idPuntoVenta;
    let idSocio;
    let idEmpleado;
    // SOCIOS => punto de venta via web
    if (req.data.rol === 'Socio') {
        idPuntoVenta = 2;
        idSocio = req.data.idSocio;
        idEmpleado = null;
        // EMPLEADOS-ADMIN => punto de venta la sucursal    
    } else if (req.data.rol === 'Admin' | req.data.rol === 'Empleado') {
        idPuntoVenta = 1;
        idEmpleado = req.data.idEmpleado;
        idSocio = null;
    }
    else {
        res.status(403).json({ "ok": false, "mensaje": "Usted no tiene los permisos requeridos para acceder a este recurso." });
        return
    }
    const { detalles, observaciones } = req.body;
    await mysqlConnection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await mysqlConnection.beginTransaction();
    mysqlConnection.query('call spRegistrarPedido(?,?,?,?,@id); select @id as id;', [idPuntoVenta, idSocio, idEmpleado, observaciones],
        async (err, rows, fields) => {
            if (!err) {
                const idPedido = rows[1][0].id;

                try {
                    for (const detalle of detalles) {
                        const { producto, cantidad, precioUnitario, puntosGanados, comentarios } = detalle;
                        mysqlConnection.query('call spRegistrarDetallePedido(?,?,?,?,?,?);', [idPedido, producto.id, cantidad, precioUnitario, puntosGanados, comentarios],
                            async (err, rows, fields) => {
                                if (err) {
                                    console.error(err);
                                    console.log("rollback");
                                    mysqlConnection.rollback();
                                    res.status(500).json({
                                        "ok": false,
                                        "mensaje": "Error al registrar pedido"

                                    });
                                    return;
                                }
                            });
                    }
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Pedido creado con éxito"
                    });
                    await mysqlConnection.commit();
                }
                catch (e) {
                    console.error(e);
                    console.log("rollback");
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al registrar pedido"

                    });
                    await mysqlConnection.rollback();
                }

            } else {
                console.log(err);
                console.log("rollback");
                mysqlConnection.rollback();
                res.status(500).json({
                    "ok": false,
                    "mensaje": "Error al registrar pedido"

                });
            }
        });
});
router.post('/sinLogin', async (req, res) => {
    idPuntoVenta = 2;
    const { detalles, observaciones } = req.body;
    await mysqlConnection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await mysqlConnection.beginTransaction();
    mysqlConnection.query('call spRegistrarPedido(?,?,?,?,@id); select @id as id;', [idPuntoVenta, null, null, observaciones],
        async (err, rows, fields) => {
            if (!err) {
                const idPedido = rows[1][0].id;

                try {
                    for (const detalle of detalles) {
                        const { producto, cantidad, precioUnitario, puntosGanados, comentarios } = detalle;
                        mysqlConnection.query('call spRegistrarDetallePedido(?,?,?,?,?,?);', [idPedido, producto.id, cantidad, precioUnitario, puntosGanados, comentarios],
                            async (err, rows, fields) => {
                                if (err) {
                                    console.error(err);
                                    console.log("rollback");
                                    mysqlConnection.rollback();
                                    res.status(500).json({
                                        "ok": false,
                                        "mensaje": "Error al registrar pedido"

                                    });
                                    return;
                                }
                            });
                    }
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Pedido generado con éxito"
                    });
                    await mysqlConnection.commit();
                }
                catch (e) {
                    console.error(e);
                    console.log("rollback");
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al registrar pedido"

                    });
                    await mysqlConnection.rollback();
                }

            } else {
                console.log(err);
                console.log("rollback");
                mysqlConnection.rollback();
                res.status(500).json({
                    "ok": false,
                    "mensaje": "Error al registrar pedido"

                });
            }
        });
});
router.delete('/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {

        mysqlConnection.query('select idSocio from pedidos where id = ?;', [req.params['id']],
            (err, rows, fields) => {
                const idSocio = rows[0].idSocio;

                //   PERSONA-ADMIN-EMPLEADO  pueden cancelar el pedido
                if ((req.data.idSocio && req.data.idSocio == idSocio) || req.data.rol === 'Admin' || req.data.rol === 'Empleado') {
                    mysqlConnection.query('call spCancelarPedido(?)', [req.params['id']],
                        (err, rows, fields) => {
                            if (!err) {
                                res.status(201).json({
                                    "ok": true,
                                    "mensaje": "Pedido cancelado con éxito"
                                });
                            } else {
                                console.log(err);
                                res.status(500).json({
                                    "ok": false,
                                    "mensaje": "Error al cancelar pedido"
                                });
                            }
                        });
                } else {
                    res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
                }
            })

    });

router.get('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {

        mysqlConnection.query('call spObtenerPedidos();',
            (err, rows, fields) => {mysqlConnection
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar pedidos" })
                    console.log(err);
                }
            })
    });

router.get('/detalles/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {

        mysqlConnection.query('call spObtenerDetalles(?);', [req.params['id']],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar los detalles de pedido" })
                    console.log(err);
                }
            })
    });
router.get('/pendientes',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {
        mysqlConnection.query('call spObtenerPedidosPendientes();',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar pedidos" })
                    console.log(err);
                }
            })
    });
router.put('/estado',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {

        const { idEstado, idPedido } = req.body;
        mysqlConnection.query('call spActualizarEstadoPedido(?,?)', [idEstado, idPedido],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Estado del pedido actualizado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al actualizar estado de pedido"
                    });
                }
            });
    });

router.get('/propios',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {
        if (!req.data.idSocio) {
            res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
            return;
        }
        mysqlConnection.query('call spObtenerMisPedidos(?);',
            [req.data.idSocio],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar pedidos" })
                    console.log(err);
                }
            })
    });

router.get('/:id',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ],
    (req, res) => {

        mysqlConnection.query('call spObtenerPedidoPorId(?);', [req.params['id']],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar pedidos" })
                    console.log(err);
                }
            })
    });

module.exports = router;