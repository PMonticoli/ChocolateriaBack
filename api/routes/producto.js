const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fs = require('fs');

// MULTER PARA MANEJAR LAS IMG PRODUCTOS
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

router.get('/activosFiltrados', (req, res) => {
    const { precioMin, precioMax } = req.query;
    mysqlConnection.query(
      'CALL spProductosFiltrados(?, ?)',
      [precioMin, precioMax],
      (err, rows, fields) => {
        if (!err) {
          res.status(200).json({ "ok": true, "resultado": rows[0] });
        } else {
          res.status(500).json({ "ok": false, "mensaje": "Error al listar productos" });
          console.log(err);
        }
      }
    );
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


router.put('/', [
    authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado,
    upload.single('file')
  ], (req, res) => {
    const { id, nombre, precio, descripcion, observaciones, activo, disponible, puntosGanados } = req.body;
    let urlImagen = req.body.urlImagen || null;
    
    urlImagen = req.body.urlImagen ? req.body.urlImagen.replace(/^.*\\/, '') : null;
  
    if (req.file) {
      urlImagen = path.normalize(`uploads/${req.file.filename}`);
    }
  
    mysqlConnection.query('call spActualizarProducto(?,?,?,?,?,?,?,?,?)', [id, nombre, precio, descripcion, observaciones, activo, disponible, puntosGanados, urlImagen], (err, rows, fields) => {
      if (!err) {
        res.status(200).json({
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

    router.post('/cantidadProd', [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta, limite } = req.body;
        mysqlConnection.query('call spRankingCantidadProd(?,?,?)',
            [new Date(fechaDesde), new Date(fechaHasta), limite],
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

    router.post('/promedioProd', [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta, limite } = req.body;
        mysqlConnection.query('call spRankingPromedioProd(?,?,?)',
            [new Date(fechaDesde), new Date(fechaHasta), limite],
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


    router.post('/reporteCantidad', [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spReporteCantidadProd(?,?)',
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

    router.post('/reportePromedio', [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ], (req, res) => {
        const { fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spReportePromedioProd(?,?)',
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