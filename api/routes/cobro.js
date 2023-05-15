const express = require('express');
const app = require('../../app');
const router = express.Router();
const mysqlConnection = require('../connection/connection');
const authJwt = require('../middleware/authjwt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {
        const { idPedido, tipoPago, codigoAutorizacion, montoCobrado } = req.body;
        mysqlConnection.query('select idSocio from pedidos where id = ?;', [idPedido],
            (err, rows, fields) => {
                const idSocio = rows[0].idSocio;
                //   Puede realizar el cobro/pago tanto la persona que hizo el pedido,el ADMIN o un EMPLEADO
                if ((req.data.idSocio && req.data.idSocio == idSocio) || req.data.rol === 'Admin' || req.data.rol === 'Empleado') {
                    mysqlConnection.query('call spCobrar(?,?,?,?,?)',
                        [
                            idPedido, tipoPago.id,
                            req.data.idEmpleado ? req.data.idEmpleado : null,
                            codigoAutorizacion, montoCobrado
                        ],
                        (err, rows, fields) => {
                            if (!err) {
                                res.status(201).json({
                                    "ok": true,
                                    "mensaje": "Cobro registrado con éxito"
                                });
                            } else {
                                console.log(err);
                                res.status(500).json({
                                    "ok": false,
                                    "mensaje": "Error al registrar cobro"
                                });
                            }
                        });
                } else {
                    res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
                }
            });


    });

    router.post('/reporteCobros',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spReporteCobros(?,?)', 
        [new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({
                        "ok": true,
                        "mensaje": "Reporte cobros generado con éxito",
                        "resultado": rows[0]
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al generar reporte cobros"
                    });
                }
            });
        
});

module.exports = router