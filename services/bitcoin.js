import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkBTC(address, lastConfirmedTxId = null) {
  console.log("🔍 Buscando transacción BTC confirmada...");

  const timeoutMs = 10 * 60 * 1000; // 10 minutos
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      return {
        paid: false,
        error: "Timeout: no se detectó una nueva transacción BTC en 10 minutos."
      };
    }

    try {
      const res = await axios.get(`https://mempool.space/api/address/${address}`);
      const txs = res.data.txrefs || [];

      const confirmedTx = txs.find(tx => tx.confirmations > 0 && tx.tx_hash !== lastConfirmedTxId);

      if (confirmedTx) {
        const amountBTC = confirmedTx.value / 1e8; // satoshis a BTC

        return {
          paid: true,
          txid: confirmedTx.tx_hash,
          amount: amountBTC,
          message: `✅ Transacción BTC confirmada: ${amountBTC} BTC recibidos en ${address}`
        };
      }
    } catch (err) {
      console.error("⚠️ BTC check error:", err.message);
    }

    await delay(5000);
  }
}
