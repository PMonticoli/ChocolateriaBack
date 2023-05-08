const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

router.get('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado], (req, res) => {
        mysqlConnection.query('call spObtenerPromociones();',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows[0] })
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al listar promociones" })
                    console.log(err);
                }
            })
    });

    router.get(
        "/detalles/:id",
        [authJwt.verifyToken, authJwt.invalidTokenCheck],
        (req, res) => {
          mysqlConnection.query(
            "call spObtenerDetallesPromocion(?);",
            [req.params["id"]],
            (err, rows, fields) => {
              if (!err) {
                res.status(200).json({ ok: true, resultado: rows[0] });
              } else {
                res.status(500).json({
                  ok: false,
                  mensaje: "Error al listar los detalles de promocion",
                });
                console.log(err);
              }
            }
          );
        }
      );


router.post('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esEmpleado],
    async (req, res) => {

        const { nombre, descripcion, precioPuntos, detalles, fechaDesde, fechaHasta } = req.body;
        await mysqlConnection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await mysqlConnection.beginTransaction();
        mysqlConnection.query('call spRegistrarPromocion(?,?,?,?,?,@id); select @id as id;',
            [nombre, descripcion, precioPuntos, new Date(fechaDesde), new Date(fechaHasta)],
            async (err, rows, fields) => {
                if (!err) {
                    const idPromocion = rows[1][0].id;
                    try {
                        for (const det of detalles) {
                            const { producto, cantidad } = det;
                            mysqlConnection.query('call spRegistrarDetallePromocion(?,?,?);', 
                            [idPromocion, producto.id, cantidad],
                                async (err, rows, fields) => {
                                    if (err) {
                                        console.error(err);
                                        console.log("rollback");
                                        mysqlConnection.rollback();
                                        res.status(500).json({
                                            "ok": false,
                                            "mensaje": "Error al registrar promocion"
                                        });
                                        return;
                                    }
                                });
                        }
                        res.status(201).json({
                            "ok": true,
                            "mensaje": "Promocion registrada con éxito"
                        });
                        await mysqlConnection.commit();
                    }
                    catch (e) {
                        console.error(e);
                        console.log("rollback");
                        res.status(500).json({
                            "ok": false,
                            "mensaje": "Error al registrar promocion"

                        });
                        await mysqlConnection.rollback();
                    }

                } else {
                    console.log(err);
                    console.log("rollback");
                    mysqlConnection.rollback();
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al registrar promocion"

                    });
                }
            });
    });


router.get('/disponibles', (req, res) => {
    mysqlConnection.query('call spObtenerPromocionesDisponibles();',
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ "ok": true, "resultado": rows[0]});
            } else {
                res.status(500).json({"ok": false, "mensaje": "Error al listar promociones disponibles" })
                console.log(err);
                }
            })
    });

    router.put('/',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado
    ],
    (req, res) => {
        const { id, nombre, descripcion, precioPuntos, fechaDesde, fechaHasta } = req.body;
        mysqlConnection.query('call spEditarPromocion(?,?,?,?,?,?)', 
        [id, nombre, descripcion, precioPuntos, new Date(fechaDesde), new Date(fechaHasta)],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Promocion actualizada con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al intentar actualizar promoción"
                    });
                }
            });
    });

router.delete('/:id', 
[authJwt.verifyToken, 
authJwt.invalidTokenCheck, 
authJwt.esEmpleado],
(req,res)=>{
    mysqlConnection.query('call spFinalizarPromocion(?);',[req.params['id']],
    (err,rows,fields)=>{
        if(!err){
            res.status(200).json({
            "ok": true,
            "mensaje": "Promoción finalizada con éxito"});
        }else{
            console.log(err);
            res.status(500).json({
                "ok": false,
                "mensaje": "Error al finalizar promoción"
            });
        }
    });
});

router.post('/canjear',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck
    ], (req, res) => {
        if (!req.data.idSocio) {
            res.status(403).json({ 
            "ok": false,
            "mensaje": "Usted no posee los permisos requeridos para acceder a este recurso" });
            return;
        }
        mysqlConnection.query('call spCanjearPuntos(?,?)', [req.body.id, req.data.idSocio],
            (err, rows, fields) => {
                if (!err) {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Canjeo la promoción con éxito"
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al intentar realizar el canje de promoción"
                    });
                }
            });
    });

    router.get('/canjeadas', 
    [authJwt.verifyToken,
        authJwt.invalidTokenCheck,
        authJwt.esEmpleado],
    (req, res) => {
        mysqlConnection.query('CALL spObtenerPromocionesCanjeadas()', (error, results, fields) => {
          if (error) {
            console.log(error);
            res.status(500).send('Error al obtener las promociones canjeadas');
          } else {
            const promocionesCanjeadas = Array.isArray(results[0]) ? results[0] : [results[0]];
            res.json(promocionesCanjeadas);
          }
        });
      });


      router.post('/reportePromocion', 
      [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado], 
      (req, res) => {
          const { fechaDesde, fechaHasta } = req.body;
          mysqlConnection.query('call spReportePromociones(?, ?)', 
          [new Date(fechaDesde), new Date(fechaHasta)],
              (err, rows, fields) => {
                  if (!err) {
                      res.status(201).json({
                          "ok": true,
                          "resultado": rows[0],
                          "mensaje": "Reporte de promociones generado con éxito"
                      });
                  } else {
                      console.log(err);
                      res.status(500).json({
                          "ok": false,
                          "mensaje": "Error al generar reporte promociones"
                      });
                  }
              });    
      });


module.exports = router;    