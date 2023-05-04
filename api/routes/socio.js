const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');
const mysqlConnection = require('../connection/connection');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.get('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado], (req, res) => {
        mysqlConnection.query('call spObtenerSocios();',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al intentar listar socios" })
                    console.log(err);
                }
            })
    });

    router.post('/', (req, res) => {
        const { idUsuario, nombre, apellido, domicilio, email, dni, telefono } = req.body;
        mysqlConnection.query('call spRegistrarSocio(?,?,?,?,?,?,?)', [idUsuario, nombre, apellido, domicilio, email, dni, telefono],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Socio registrado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al registrar socio"
                    });
                }
            });
    
    });

    router.delete('/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.checkIdSocio],
    (req, res) => {
        mysqlConnection.query('call spDarDeBajaSocio(?,@status); select @status as status;', [req.params['id']],
            (err, rows, fields) => {
                if (!err) {
                    const status = rows[1][0].status;
                    if (status == 1) {
                        res.status(200).json({
                            "ok": true,
                            "mensaje": "Socio dado de baja con éxito"
                        });
                    } else if (status == 0) {
                        res.status(404).json({
                            "ok": false,
                            "mensaje": `No se encontró al socio con id ${req.params['id']}`
                        });
                    }

                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al intentar dar de baja al socio"
                    });
                }
            })
    });

    router.get('/puntos',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {
        if (!req.data.idSocio) {
            res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
            return;
        }
        mysqlConnection.query('call spObtenerPuntosDeSocio(?);',
            [req.data.idSocio],
            (err, rows, fields) => {
                if (rows.length < 1) {
                    res.status(404).json({ "ok": false, "mensaje": "No se encontraron movimientos de puntos para el id especificado" });
                }
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al obtener puntos" });
                    console.log(err);
                }
            })
    });

    router.get('/existe',
    (req, res) => {
        if (!req.query.dni) {
            res.status(400).json({ "ok": false, "mensaje": "No se recibió el parametro requerido" });
            return;
        }
        mysqlConnection.query('call spObtenerSocioByDNI(?);', req.query.dni,
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json(rows[0].length > 0);
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar socios" })
                    console.log(err);
                }
            })

    });

    router.get('/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck],
    (req, res) => {
        if (req.data.rol === 'Admin' || req.data.rol === 'Empleado' || req.params['id'] == req.data.idSocio) {
            mysqlConnection.query('call spObtenerSocioById(?);', req.params['id'],
                (err, rows, fields) => {
                    if (!err) {
                        res.status(200).json({ "ok": true, "resultado": rows[0] });
                    } else {
                        res.status(500).json({ "ok": false, "mensaje": "Error al listar socios" })
                        console.log(err);
                    }
                })
        } else {
            res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
        }
    });


router.put('/',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck
    ],
    (req, res) => {
        if (req.data.rol === 'Admin' || req.data.rol === 'Empleado' || req.params['id'] == req.data.idSocio) {
            const { id, nombre, apellido, domicilio, email, telefono } = req.body;
            mysqlConnection.query('call spModificarSocio(?,?,?,?,?,?)', [nombre, apellido, domicilio, email, telefono, id],
                (err, rows, fields) => {
                    if (!err) {
                        res.status(200).json({
                            "ok": true,
                            "mensaje": "Socio actualizado con éxito"
                        });
                    } else {
                        console.log(err);
                        res.status(500).json({"ok": false, "mensaje": "Error al actualizar socio"
                        });
                    }
                });
        } else {
            res.status(403).json({ "ok": false, "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso." });
        }
    });

    router.post('/nuevos', 
    [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
    (req, res) => {    
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spSociosNuevos(?,?)', [new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "resultado": rows[0],
                        "mensaje": "Reporte cantidad de socios nuevos generado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al generar reporte socios nuevos"
                    });
                }
            });
    });

    router.post('/bajas', 
    [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
    (req, res) => {    
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spSociosBaja(?,?)', [new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "resultado": rows[0],
                        "mensaje": "Reporte cantidad de socios dados de baja generado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al generar reporte socios dados de baja"
                    });
                }
            });
    });


    router.post('/pedidos', 
    [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado], 
    (req, res) => {
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spCantPedidosPeriodo(?, ?)', 
        [new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "resultado": rows[0],
                        "mensaje": "Reporte de socios cantidad de pedidos generado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al generar reporte socio"
                    });
                }
            });    
    });


    
router.get('/reportePuntos/:limite', 
[authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado], (req, res) => {

    mysqlConnection.query('call spSociosConMasPuntos(?)', 
    [req.params['limite']],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({
                    "ok": true,
                    "resultado": rows[0],
                    "mensaje": "Socios con más puntos listados con éxito"
                });
            } else {
                console.log(err);
                res.status(500).json({
                    "ok": false,
                    "mensaje": "Error al intentar generar listado de socios"
                });
            }
        });

});


module.exports = router;    