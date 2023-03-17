const jwt = require("jsonwebtoken");
require('dotenv').config();

verifyToken = (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ "ok": false, "mensaje": "No autorizado" });
    let token = req.headers.authorization.split(' ')[1];

    if (token === '' || token === null) {
        return res.status(401).json({ "ok": false, "mensaje": "Token vacío" });
    }
    let contenido = jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return undefined;
        } else {
            return decoded;
        }
    });
    req.data = contenido;
    return next();
}

invalidTokenCheck = async (req, res, next) => {
    if (!req.data) {
        return res.status(401).json({ "ok": false, "mensaje": "Token inválido." });
    } else {
        return next();
    }
};

esEmpleado = async (req, res, next) => {
    if (req.data.rol === 'Empleado' || req.data.rol === 'Admin'){
        return next();
    } else {
        res.status(403).json({ "ok": false, "mensaje": "Usted no tiene los permisos requeridos para acceder a este recurso." });
    }
};

const authJwt = {
    verifyToken,
    invalidTokenCheck,
    esEmpleado
  };
  
  module.exports = authJwt;