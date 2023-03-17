const express = require('express');
const app = require('../../app');
const router = express.Router();
const authJwt = require('../middleware/authjwt');

const mysqlConnection = require('../connection/connection');

const jwt = require('jsonwebtoken');

router.get('/', (req,res) => {
mysqlConnection.query('select * from usuarios',(err,rows,fields)=> {
if(!err){
res.json(rows);
}else {
console.log(err);
}
})
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