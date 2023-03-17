const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Todos los activos o no activos, para empleados
router.get('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado]

    , (req, res) => {
        mysqlConnection.query('call spObtenerProductos();',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar productos" })
                    console.log(err);
                }
            })
    });
// Otener todos los activos o no activos =>  EMPLEADOS
router.get('/activos'
    , (req, res) => {
        mysqlConnection.query('call spObtenerProductosActivos();',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar productos" })
                    console.log(err);
                }
            })
    });
router.get('/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {
        mysqlConnection.query('call spObtenerProductoPorID(?)', [req.params['id']],
            (err, rows, fields) => {
                if (!err) {
                    if (rows.length > 0) {
                        res.status(200).json({ "ok": true, "resultado": rows[0] });
                    } else {
                        res.status(404).json({ "ok": false, "resultado": [] });
                    }
                } else {
                    console.log(err);
                }
            })
    });

router.post('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado], (req, res) => {

        const { nombre, precio, descripcion, observaciones, activo, disponible, puntosGanados, urlImagen } = req.body;
        mysqlConnection.query('call spInsertarProducto(?,?,?,?,?,?,?,?)', [nombre, precio, descripcion, observaciones, activo, disponible, puntosGanados, urlImagen],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Producto creado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al crear producto"
                    });
                }
            });
    });

router.put('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {
        const { id, nombre, precio, descripcion, observaciones, activo, disponible,puntosGanados, urlImagen } = req.body;
        mysqlConnection.query('call spActualizarProducto(?,?,?,?,?,?,?,?,?)', [id, nombre, precio, descripcion, observaciones, activo, disponible,puntosGanados, urlImagen],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Producto actualizado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al actualizar producto"
                    });
                }
            });
    });

router.delete('/:id',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado], (req, res) => {

        mysqlConnection.query('call spBorrarProducto(?)', [req.params['id']],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({
                        "ok": true,
                        "mensaje": "Producto eliminado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al eliminar producto"
                    });
                }
            });
    });

    module.exports = router;