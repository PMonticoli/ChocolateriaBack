const express = require("express");
const app = require("../../app");
const router = express.Router();
const authJwt = require("../middleware/authjwt");

const mysqlConnection = require("../connection/connection");

const jwt = require("jsonwebtoken");
require("dotenv").config();

router.post("/",[authJwt.verifyToken, authJwt.invalidTokenCheck],(req, res) => {
    let idPuntoVenta = req.body.idPuntoVenta;
    let idSocio = req.body.idSocio;
    let idEmpleado = req.body.idEmpleado;
    if (req.data.rol === "Socio") {
      idPuntoVenta = 2;
      idSocio = req.data.idSocio;
      idEmpleado = null;
    } else if ((req.data.rol === "Admin") | (req.data.rol === "Empleado")) {
      idPuntoVenta = 1;
      idEmpleado = req.data.idEmpleado;
      idSocio = null;
    } else {
      res.status(403).json({
        ok: false,
        mensaje:
          "Usted no tiene los permisos requeridos para acceder a este recurso.",
      });
      return;
    }
    const { observaciones, detalles } = req.body;
    let idPedido;

    mysqlConnection.beginTransaction((err) => {
      if (err) throw err;

      const queryPedido = `CALL spRegistrarPedido(?, ?, ?, ?, @id); SELECT @id as id;`;

      mysqlConnection.query(
        queryPedido,
        [idPuntoVenta, idSocio, idEmpleado, observaciones],
        (err, results) => {
          if (err) {
            return mysqlConnection.rollback(() => {
              throw err;
            });
          }

          idPedido = results[1][0].id;

          detalles.forEach((detalle) => {
            const {
              producto,
              cantidad,
              precioUnitario,
              puntosGanados,
              comentarios,
            } = detalle;

            const queryDetalle = `CALL spRegistrarDetallePedido(?, ?, ?, ?, ?, ?);`;

            mysqlConnection.query(
              queryDetalle,
              [
                idPedido,
                producto.id,
                cantidad,
                precioUnitario,
                puntosGanados,
                comentarios,
              ],
              (err, results) => {
                if (err) {
                  return mysqlConnection.rollback(() => {
                    if (err) {
                    res.status(500).json({ "ok": false, "mensaje": "Stock insuficiente para realizar el pedido" })
                    console.log(err);
                }
                  });
                }
              }
            );
          });

          mysqlConnection.commit((err) => {
            if (err) {
              return mysqlConnection.rollback(() => {
                throw err;
              });
            }

            res.send({ idPedido, message: "Pedido registrado correctamente" });
          });
        }
      );
    });
  }
);

router.post("/sinLogin", async (req, res) => {
  idPuntoVenta = 2;
  const { detalles, observaciones } = req.body;
  let idPedido;

    mysqlConnection.beginTransaction((err) => {
      if (err) throw err;

      const queryPedido = `CALL spRegistrarPedido(?, ?, ?, ?, @id); SELECT @id as id;`;

      mysqlConnection.query(
        queryPedido,
        [idPuntoVenta, null, null, observaciones],
        (err, results) => {
          if (err) {
            return mysqlConnection.rollback(() => {
              throw err;
            });
          }

          idPedido = results[1][0].id;

          detalles.forEach((detalle) => {
            const {
              producto,
              cantidad,
              precioUnitario,
              puntosGanados,
              comentarios,
            } = detalle;

            const queryDetalle = `CALL spRegistrarDetallePedido(?, ?, ?, ?, ?, ?);`;

            mysqlConnection.query(
              queryDetalle,
              [
                idPedido,
                producto.id,
                cantidad,
                precioUnitario,
                puntosGanados,
                comentarios,
              ],
              (err, results) => {
                if (err) {
                  return mysqlConnection.rollback(() => {
                    if (err) {
                    res.status(500).json({ "ok": false, "mensaje": "Stock insuficiente para realizar el pedido" })
                    console.log(err);
                }
                  });
                }
              }
            );
          });

          mysqlConnection.commit((err) => {
            if (err) {
              return mysqlConnection.rollback(() => {
                throw err;
              });
            }

            res.send({ idPedido, message: "Pedido registrado correctamente" });
          });
        }
      );
    });
  }
);

router.delete(
  "/:id",
  [authJwt.verifyToken, authJwt.invalidTokenCheck],
  (req, res) => {
    mysqlConnection.query(
      "select idSocio from pedidos where id = ?;",
      [req.params["id"]],
      (err, rows, fields) => {
        const idSocio = rows[0].idSocio;

        //   PERSONA-ADMIN-EMPLEADO  pueden cancelar el pedido
        if (
          (req.data.idSocio && req.data.idSocio == idSocio) ||
          req.data.rol === "Admin" ||
          req.data.rol === "Empleado"
        ) {
          mysqlConnection.query(
            "call spCancelarPedido(?)",
            [req.params["id"]],
            (err, rows, fields) => {
              if (!err) {
                res.status(201).json({
                  ok: true,
                  mensaje: "Pedido cancelado con éxito",
                });
              } else {
                console.log(err);
                res.status(500).json({
                  ok: false,
                  mensaje: "Error al cancelar pedido",
                });
              }
            }
          );
        } else {
          res.status(403).json({
            ok: false,
            mensaje:
              "Usted no posee los permisos requeridos para acceder a este recurso.",
          });
        }
      }
    );
  }
);

router.get(
  "/",
  [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
  (req, res) => {
    mysqlConnection.query("call spObtenerPedidos();", (err, rows, fields) => {
      mysqlConnection;
      if (!err) {
        res.status(200).json({ ok: true, resultado: rows[0] });
      } else {
        res.status(500).json({ ok: false, mensaje: "Error al listar pedidos" });
        console.log(err);
      }
    });
  }
);

router.get(
  "/detalles/:id",
  [authJwt.verifyToken, authJwt.invalidTokenCheck],
  (req, res) => {
    mysqlConnection.query(
      "call spObtenerDetalles(?);",
      [req.params["id"]],
      (err, rows, fields) => {
        if (!err) {
          res.status(200).json({ ok: true, resultado: rows[0] });
        } else {
          res.status(500).json({
            ok: false,
            mensaje: "Error al listar los detalles de pedido",
          });
          console.log(err);
        }
      }
    );
  }
);
router.get(
  "/pendientes",
  [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
  (req, res) => {
    mysqlConnection.query(
      "call spObtenerPedidosPendientes();",
      (err, rows, fields) => {
        if (!err) {
          res.status(200).json({ ok: true, resultado: rows[0] });
        } else {
          res
            .status(500)
            .json({ ok: false, mensaje: "Error al listar pedidos" });
          console.log(err);
        }
      }
    );
  }
);
router.put(
  "/estado",
  [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
  (req, res) => {
    const { idEstado, idPedido } = req.body;
    mysqlConnection.query(
      "call spActualizarEstadoPedido(?,?)",
      [idEstado, idPedido],
      (err, rows, fields) => {
        if (!err) {
          res.status(201).json({
            ok: true,
            mensaje: "Estado del pedido actualizado con éxito",
          });
        } else {
          console.log(err);
          res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar estado de pedido",
          });
        }
      }
    );
  }
);

router.get(
  "/propios",
  [authJwt.verifyToken, authJwt.invalidTokenCheck],
  (req, res) => {
    if (!req.data.idSocio) {
      res.status(403).json({
        ok: false,
        mensaje:
          "Usted no posee los permisos requeridos para acceder a este recurso.",
      });
      return;
    }
    mysqlConnection.query(
      "call spObtenerMisPedidos(?);",
      [req.data.idSocio],
      (err, rows, fields) => {
        if (!err) {
          res.status(200).json({ ok: true, resultado: rows[0] });
        } else {
          res
            .status(500)
            .json({ ok: false, mensaje: "Error al listar pedidos" });
          console.log(err);
        }
      }
    );
  }
);

router.get(
  "/:id",
  [authJwt.verifyToken, authJwt.invalidTokenCheck, authJwt.esEmpleado],
  (req, res) => {
    mysqlConnection.query(
      "call spObtenerPedidoPorId(?);",
      [req.params["id"]],
      (err, rows, fields) => {
        if (!err) {
          res.status(200).json({ ok: true, resultado: rows[0] });
        } else {
          res
            .status(500)
            .json({ ok: false, mensaje: "Error al listar pedidos" });
          console.log(err);
        }
      }
    );
  }
);

module.exports = router;
