import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { checkBTC } from "./services/bitcoin.js";
import { checkUSDT } from "./services/usdt.js";
import { checkXRP } from "./services/xrp.js";
import axios from "axios";

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

async function sendTelegramAlert({ amount, address, currency, txid }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const message = `📥 *Nueva transacción confirmada*

💸 Monto: *${amount} ${currency.toUpperCase()}*
👛 Wallet: \`${address}\`
🔗 TxID: \`${txid}\``;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });
    console.log("✅ Alerta enviada a Telegram.");
  } catch (error) {
    console.error("❌ Error al enviar alerta a Telegram:", error.message);
  }
}

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
      await sendTelegramAlert({
        amount: result.amount,
        address: walletAddress,
        currency,
        txid: result.txid
      });
      return res.json({
        status: "confirmed",
        txid: result.txid,
        amount: result.amount,
        message: `✅ Transacción confirmada: ${result.amount} ${currency.toUpperCase()} recibidos en ${walletAddress}`
      });
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
