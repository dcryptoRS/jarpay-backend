import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { Pool } from "pg";
import { checkBTC } from "./services/bitcoin.js";
import { checkUSDT } from "./services/usdt.js";
import { checkXRP } from "./services/xrp.js";

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PORT = process.env.PORT || 8080;

const DEVICES = {
  dany001: {
    btc: "bc1qzs0d98vdc07t7e5u4jjyh3a2l4v9jph8s0d6ut",
    usdt: "TXjx2FicGVCvTjeW7EcTuPBkTn9LYErSwX",
    xrp: "rK762yy27FitJTK8BuummwwRjLgvWQmN44"
  }
};

// Crear tabla con `txid` como clave única
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS confirmed_txs (
      id SERIAL PRIMARY KEY,
      device_currency TEXT NOT NULL,
      txid TEXT NOT NULL UNIQUE,
      amount TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
initDb();

// Telegram
async function sendTelegramAlert({ amount, address, currency, txid }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const message = `✅ Transacción confirmada: *${amount} ${currency.toUpperCase()}* recibidos en \`${address}\`\n🔗 https://xrpscan.com/tx/${txid}`;
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown"
  });
}

// Última txid confirmada
async function getLastTx(device_currency) {
  const r = await pool.query(
    `SELECT txid FROM confirmed_txs
     WHERE device_currency = $1
     ORDER BY timestamp DESC
     LIMIT 1`,
    [device_currency]
  );
  return r.rows[0]?.txid || null;
}

// Guardar tx confirmada, sin sobrescribir, y retornar si se insertó
export async function saveConfirmedTx(device_currency, txid, amount) {
  console.log(`💾 Guardando tx confirmada en DB: ${device_currency} - ${txid} - ${amount}`);
  try {
    const result = await pool.query(
      `INSERT INTO confirmed_txs (device_currency, txid, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (txid) DO NOTHING
       RETURNING *;`,
      [device_currency, txid, amount]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.error("❌ Error al guardar transacción confirmada:", err.message);
    return false;
  }
}

// Endpoint principal
app.get("/check-payment/:deviceId/:currency", async (req, res) => {
  const { deviceId, currency } = req.params;
  const token = req.query.token;
  if (token !== process.env.ACCESS_TOKEN) return res.status(403).json({ error: "Unauthorized" });

  const device = DEVICES[deviceId];
  if (!device) return res.status(400).json({ error: "Dispositivo no encontrado" });

  const walletAddress = device[currency];
  if (!walletAddress) return res.status(400).json({ error: "Wallet no configurada" });

  const key = `${deviceId}_${currency}`;
  const lastTxId = await getLastTx(key);

  let result;
  try {
    if (currency === "btc") result = await checkBTC(walletAddress, lastTxId);
    else if (currency === "usdt") result = await checkUSDT(walletAddress, lastTxId);
    else if (currency === "xrp") result = await checkXRP(walletAddress, lastTxId);
    else return res.status(400).json({ error: "Unsupported currency" });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }

  if (result.paid) {
    if (result.txid !== lastTxId) {
      const wasSaved = await saveConfirmedTx(key, result.txid, result.amount);

      if (wasSaved) {
        await sendTelegramAlert({
          amount: result.amount,
          address: walletAddress,
          currency,
          txid: result.txid
        });
      }

      return res.json({
        status: "confirmed",
        txid: result.txid,
        amount: result.amount,
        message: result.message
      });
    } else {
      return res.json({ status: "pending" });
    }
  }

  if (result.error) return res.json({ status: "error", message: result.error });
  return res.json({ status: "pending" });
});

app.listen(PORT, () => {
  console.log(`📡 Jar-Pay backend running on port ${PORT}`);
});
