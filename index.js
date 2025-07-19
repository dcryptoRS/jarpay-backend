import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { checkBTC } from "./services/bitcoin.js";
import { checkUSDT } from "./services/usdt.js";
import { checkXRP } from "./services/xrp.js";

const app = express();
const PORT = process.env.PORT || 8080;

const DEVICES = {
  dany001: {
    btc: "bc1qzs0d98vdc07t7e5u4jjyh3a2l4v9jph8s0d6ut",
    usdt: "TXjx2FicGVCvTjeW7EcTuPBkTn9LYErSwX",
    xrp: "rK762yy27FitJTK8BuummwwRjLgvWQmN44"
  }
  // Agrega más dispositivos aquí
};

app.get("/check-payment/:deviceId/:currency", async (req, res) => {
  const { deviceId, currency } = req.params;
  const token = req.query.token;

  if (token !== process.env.ACCESS_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const device = DEVICES[deviceId];
  if (!device) {
    return res.status(400).json({ error: "Dispositivo no encontrado" });
  }

  const walletAddress = device[currency];
  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet no configurada para esta moneda" });
  }

  try {
    let result;
    if (currency === "btc") result = await checkBTC(walletAddress);
    else if (currency === "usdt") result = await checkUSDT(walletAddress);
    else if (currency === "xrp") result = await checkXRP(walletAddress);
    else return res.status(400).json({ error: "Unsupported currency" });

    if (result.paid) {
      return res.json({ status: "confirmed", txid: result.txid });
    } else {
      return res.json({ status: "pending" });
    }
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Jar-Pay backend running on port ${PORT}`);
});
