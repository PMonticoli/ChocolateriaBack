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
    const { usuario, contrasenia } = req.body;
    mysqlConnection.query('call spIniciarSesion(?,?)',
        [usuario, contrasenia],
        (err, rows, fields) => {
            rows = rows[0];
            if (!err) {
                if (rows.length > 0) {
                    let data = JSON.stringify(rows[0]);
                    const token = jwt.sign(data, process.env.SECRET_KEY);
                    res.status(200).json({
                        "ok": true,
                        "resultado": [token]
                    });
                } else {
                    res.status(200).json({
                        "ok": false,
                        "mensaje": "Usuario y/o contraseña incorrectos"
                    });
                }
            } else {
                console.log(err);
            }
        }
    );
});

module.exports = router;