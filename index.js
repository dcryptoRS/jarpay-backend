import express from "express";
import { checkBTC } from "./services/bitcoin.js";
import { checkUSDT } from "./services/usdt.js";
import { checkXRP } from "./services/xrp.js";

const app = express();
const PORT = process.env.PORT || 3000;

const WALLETS = {
  btc: "bc1qzs0d98vdc07t7e5u4jjyh3a2l4v9jph8s0d6ut",
  usdt: "TXjx2FicGVCvTjeW7EcTuPBkTn9LYErSwX",
  xrp: "rK762yy27FitJTK8BuummwwRjLgvWQmN44",
};

app.get("/check-payment/:currency", async (req, res) => {
  const { currency } = req.params;

  let result;
  if (currency === "btc") result = await checkBTC(WALLETS.btc);
  else if (currency === "usdt") result = await checkUSDT(WALLETS.usdt);
  else if (currency === "xrp") result = await checkXRP(WALLETS.xrp);
  else return res.status(400).json({ error: "Unsupported currency" });

  if (result.paid) {
    return res.json({ status: "confirmed", txid: result.txid });
  } else {
    return res.json({ status: "pending" });
  }
});

app.listen(PORT, () => {
  console.log(`Jar-Pay backend running on port ${PORT}`);
});
