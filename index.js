import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { checkBTC } from "./services/bitcoin.js";
import { checkUSDT } from "./services/usdt.js";
import { checkXRP } from "./services/xrp.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 60000;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS) || 5000;

let devices = {};

async function loadDevices() {
  const filePath = path.resolve("./devices.json");
  try {
    const data = await fs.readFile(filePath, "utf8");
    devices = JSON.parse(data);
    console.log("Devices cargados:", Object.keys(devices));
  } catch (err) {
    console.error("Error cargando devices.json:", err);
  }
}

// Polling genérico con timeout
const pollTransaction = async (checkFn, timeout = TIMEOUT_MS, interval = POLL_INTERVAL_MS) => {
  const start = Date.now();

  return new Promise((resolve) => {
    const poll = async () => {
      const result = await checkFn();
      if (result.paid) {
        resolve({ status: "confirmed", txid: result.txid });
      } else if (Date.now() - start >= timeout) {
        resolve({ status: "error", message: "Timeout: no se detectó la transacción en 1 minuto." });
      } else {
        setTimeout(poll, interval);
      }
    };
    poll();
  });
};

app.get("/check-payment/:deviceId/:currency", async (req, res) => {
  const { deviceId, currency } = req.params;
  const token = req.query.token;

  // Validar dispositivo
  const device = devices[deviceId];
  if (!device) {
    return res.status(404).json({ error: "Dispositivo no encontrado" });
  }

  // Validar token
  if (token !== device.token) {
    return res.status(403).json({ error: "Token inválido" });
  }

  // Validar moneda
  const wallet = device[currency];
  if (!wallet) {
    return res.status(400).json({ error: "Moneda no soportada para este dispositivo" });
  }

  // Verificar pago
  let result;
  if (currency === "btc") {
    result = await pollTransaction(() => checkBTC(wallet));
  } else if (currency === "usdt") {
    result = await pollTransaction(() => checkUSDT(wallet));
  } else if (currency === "xrp") {
    result = await pollTransaction(() => checkXRP(wallet));
  } else {
    return res.status(400).json({ error: "Moneda no soportada" });
  }

  res.json(result);
});

// Carga inicial de dispositivos y arranque
loadDevices().then(() => {
  app.listen(PORT, () => {
    console.log(`Jar-Pay backend corriendo en puerto ${PORT}`);
  });
});
