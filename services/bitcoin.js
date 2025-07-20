import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Revisa si hay una nueva transacción BTC confirmada hacia una dirección.
 * Reintenta cada 5 segundos hasta 10 minutos.
 */
export async function checkBTC(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones BTC...");
  console.log(`📨 Dirección: ${address}`);
  console.log(`🕐 Esperando hasta 10 minutos, chequeando cada 5 segundos...`);

  const timeoutMs = 10 * 60 * 1000;
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      console.log("❌ Tiempo de espera agotado sin encontrar transacción nueva.");
      return {
        paid: false,
        error: "Timeout: no se detectó una nueva transacción en 10 minutos."
      };
    }

    try {
      const res = await axios.get(`https://mempool.space/api/address/${address}/txs`);
      const txs = res.data;

      if (!Array.isArray(txs) || txs.length === 0) {
        console.log("⏳ Sin transacciones BTC aún...");
        await delay(5000);
        continue;
      }

      const confirmedTxs = txs.filter(tx => tx.status?.confirmed);

      const newTx = confirmedTxs.find(tx => tx.txid !== lastConfirmedTxId);

      if (!newTx) {
        console.log("⏳ No se encontró transacción BTC nueva confirmada.");
        await delay(5000);
        continue;
      }

      const outputToAddress = newTx.vout.find(v => v.scriptpubkey_address === address);
      const amountBTC = outputToAddress ? outputToAddress.value / 1e8 : 0;

      const message = `✅ Pago en BTC confirmado por ${amountBTC} BTC\nHash: ${newTx.txid}`;
      console.log(message);

      return {
        paid: true,
        txid: newTx.txid,
        amount: amountBTC,
        message
      };

    } catch (err) {
      console.error("⚠️ Error consultando mempool.space BTC:", err.message);
    }

    await delay(5000);
  }
}
