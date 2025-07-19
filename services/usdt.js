import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkUSDT(address, lastConfirmedTxId = null) {
  console.log("🔍 Buscando transacción USDT confirmada...");

  const timeoutMs = 10 * 60 * 1000; // 10 minutos
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      return {
        paid: false,
        error: "Timeout: no se detectó una nueva transacción USDT en 10 minutos."
      };
    }

    try {
      const res = await axios.get(
        `https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=3&start=0&address=${address}`
      );
      const txs = res.data.data;

      const usdtTx = txs.find(tx =>
        tx.tokenInfo &&
        tx.tokenInfo.tokenAbbr === "USDT" &&
        tx.confirmed === true &&
        tx.toAddress === address &&
        tx.hash !== lastConfirmedTxId
      );

      if (usdtTx) {
        const amountUSDT = parseFloat(usdtTx.tokenTransferInfo.amount_str) / 10 ** usdtTx.tokenInfo.tokenDecimal;

        return {
          paid: true,
          txid: usdtTx.hash,
          amount: amountUSDT,
          message: `✅ Transacción USDT confirmada: ${amountUSDT} USDT recibidos en ${address}`
        };
      }
    } catch (err) {
      console.error("⚠️ USDT check error:", err.message);
    }

    await delay(5000);
  }
}
