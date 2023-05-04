const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const multer = require('multer');
const path = require('path');
const UPLOADS_FOLDER = '/uploads/';
const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads')
    },
    filename: (req, file, callBack) => {
        const ext = file.originalname.split('.').pop()
        const fileName = `${Date.now()}.${ext}`
        console.log('Nombre de archivo generado:', fileName)
        callBack(null, fileName.replace(/\\/g, '/'));
    }
})
const upload = multer({ storage })


router.post('/uploadImage', upload.single('file'), 
    (req, res) => {
    const file = req.file;
    const urlImagen = UPLOADS_FOLDER + file.filename;     
    console.log('URL de imagen generada:', urlImagen);
    (err)=>{
        if (!err) {
            res.status(201).json({
                "ok": true,
                "mensaje": "Imagen producto agregada con éxito",
                "urlImagen": urlImagen
            });
        } else {
            console.log(err);
            res.status(500).json({
                "ok": false,
                "mensaje": "Error al agregar Imagen producto"
            });
        }
    }
    res.send(file);

});



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

    router.put('/stock',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    (req, res) => {
        const { id, stock } = req.body;
        mysqlConnection.query('call spActualizarStock(?, ?)', [id, stock],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Stock producto actualizado con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al actualizar stock producto"
                    });
                }
            });
    });

    router.post('/reporte',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spReporteProductos(?,?)', 
        [new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({
                        "ok": true,
                        "mensaje": "Reporte productos generado con éxito",
                        "resultado": rows[0]
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al generar reporte productos"
                    });
                }
            });
        
});

    module.exports = router;