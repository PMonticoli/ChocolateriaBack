const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

const jwt = require('jsonwebtoken');

router.get('/',
    [authJwt.verifyToken,
    authJwt.invalidTokenCheck,
    authJwt.esAdmin], (req, res) => {

        mysqlConnection.query('select u.id, r.nombre as rol,' +
            ' u.usuario, u.fechaAlta, u.fechaBaja FROM usuarios u' +
            ' join roles r on r.id = u.idRol;',
            (err, rows, fields) => {
                if (!err) {
                    res.status(200).json({ "ok": true, "resultado": rows });
                } else {
                    res.status(500).json({ "ok": false, "mensaje": "Error al intentar listar usuarios" })
                    console.log(err);
                }
            })
    });

router.get('/rol',
    [
        authJwt.verifyToken,
        authJwt.invalidTokenCheck
    ], (req, res) => {
        res.status(200).json({
            "ok": true,
            resultado: [req.data.rol]
        });
    });

router.post('/iniciarSesion', (req, res) => {
        const { usuario, contrasenia, terminos } = req.body;
        mysqlConnection.query('CALL spIniciarSesion(?,?,?)', 
        [usuario, contrasenia, terminos], (err, rows, fields) => {
            if (!err) {
                rows = rows[0];
                if (rows[0].mensaje === 'Usuario y/o contraseña incorrectos') {
                    res.status(200).json({
                        "ok": false,
                        "mensaje": rows[0].mensaje
                    });
                } else if (rows[0].mensaje === 'Debes aceptar los Términos y condiciones') {
                    res.status(200).json({
                        "ok": false,
                        "mensaje": rows[0].mensaje
                    });
                } else if (rows[0].mensaje === 'Usuario dado de baja') {
                    res.status(200).json({
                        "ok": false,
                        "mensaje": rows[0].mensaje
                    });
                } else {
                    if (rows.length > 0) {
                        let data = JSON.stringify(rows[0]);
                        const token = jwt.sign(data, process.env.SECRET_KEY);
                        res.status(200).json({
                            "ok": true,
                            "resultado": [token]
                        });
                    }
                }
            } else {
                console.log(err);
                res.status(500).json({
                    "ok": false,
                    "mensaje": "Error en el servidor"
                });
            }
        });
    });

router.post('/iniciarSesion', (req, res) => {
    const { usuario, contrasenia, terminos } = req.body;
    mysqlConnection.query(
      'CALL spIniciarSesion(?,?,?)',
      [usuario, contrasenia, terminos],
      (err, rows, fields) => {
        if (!err) {
          const result = rows[0][0];
          if (result.mensaje === 'Usuario y/o contraseña incorrectos') {
            res.status(200).json({
              ok: false,
              mensaje: result.mensaje,
            });
          } else if (
            result.mensaje === 'Debes aceptar los Términos y condiciones'
          ) {
            res.status(200).json({
              ok: false,
              mensaje: result.mensaje,
            });
          } else if (result.mensaje === 'Usuario dado de baja') {
            res.status(200).json({
              ok: false,
              mensaje: result.mensaje,
            });
          } else {
            const data = JSON.stringify(result);
            const token = jwt.sign(data, process.env.SECRET_KEY);
            res.status(200).json({
              ok: true,
              resultado: [token],
            });
          }
        } else {
          console.log(err);
          res.status(500).json({
            ok: false,
            mensaje: 'Error en el servidor',
          });
        }
      }
    );
  });
  
    
router.post('/nuevoUsuarioSocio', (req, res) => {
    const { usuario, contrasenia, dni } = req.body;
    mysqlConnection.query('CALL spNuevoUsuarioSocio(?, ?, ?)', [usuario, contrasenia, dni],
        (err, rows, fields) => {
            if (err) {
                if (err.code === '45000') {
                    res.status(400).json({
                        "ok": false,
                        "mensaje": err.sqlMessage
                    });
                } else {
                    console.log(err);
                    res.status(500).json({
                        "ok": false,
                        "mensaje": "Error al crear usuario"
                    });
                }
            } else {
                if (rows.length > 0 && rows[0][0].error_message) {
                    res.status(400).json({
                        "ok": false,
                        "mensaje": rows[0][0].error_message
                    });
                } else {
                    res.status(201).json({
                        "ok": true,
                        "mensaje": "Usuario creado con éxito"
                    });
                }
            }
        });
});

router.put('/nuevaClave', (req, res) => {
    const { usuario, contrasenia, dni } = req.body;
    mysqlConnection.query('CALL spRecuperarPassword(?, ?, ?)', 
    [usuario, contrasenia, dni], 
    (err, results) => {
        if (!err) {
            const mensaje = results[0][0].mensaje;
            res.status(201).json({
                "ok": true,
                "mensaje": mensaje
            });
        } else {
            console.log(err);
            res.status(500).json({
                "ok": false,
                "mensaje": "Error al intentar actualizar contraseña"
            });
        }
    });
});

router.delete('/:id',
[authJwt.verifyToken,
authJwt.invalidTokenCheck,
authJwt.checkIdSocio],
(req, res) => {
    mysqlConnection.query('call spDarDeBajaUsuario(?,@status); select @status as status;', [req.params['id']],
        (err, rows, fields) => {
            if (!err) {
                const status = rows[1][0].status;
                if (status == 1) {
                    res.status(200).json({
                        "ok": true,
                        "mensaje": "Usuario dado de baja con éxito"
                    });
                } else if (status == 0) {
                    res.status(404).json({
                        "ok": false,
                        "mensaje": `No se encontró al usuario con id ${req.params['id']}`
                    });
                }

            } else {
                console.log(err);
                res.status(500).json({
                    "ok": false,
                    "mensaje": "Error al intentar dar de baja al usuario"
                });
            }
        })
});


module.exports = router;