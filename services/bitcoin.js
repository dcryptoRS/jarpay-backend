import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Revisa si hay una nueva transacción confirmada hacia una dirección BTC.
 * Reintenta cada 5 segundos hasta 10 minutos.
 * 
 * @param {string} address Dirección BTC a monitorear
 * @param {string|null} lastConfirmedTxId Hash de la última transacción confirmada, para evitar repeticiones
 * @returns {object} { paid, txid, amount, message } o { paid: false, error }
 */
export async function checkBTC(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones BTC...");
  console.log(`📨 Dirección: ${address}`);
  console.log(`🕐 Esperando hasta 10 minutos, chequeando cada 5 segundos...`);

  const timeoutMs = 10 * 60 * 1000; // 10 minutos
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
      const res = await axios.get(`https://mempool.space/api/address/${address}`);
      const txs = res.data.txrefs || [];

      if (!Array.isArray(txs) || txs.length === 0) {
        console.log("⏳ Sin transacciones BTC aún...");
        await delay(5000);
        continue;
      }

      // Ordenar txs más recientes primero
      txs.sort((a, b) => b.confirmation_height - a.confirmation_height);

      // Buscar tx diferente a la última confirmada
      const newTx = txs.find(tx => tx.tx_hash !== lastConfirmedTxId);

      if (!newTx) {
        console.log("⏳ No se encontró transacción BTC nueva distinta a la última confirmada.");
        await delay(5000);
        continue;
      }

      const amountBTC = newTx.value / 1e8; // satoshis a BTC

      const message = `✅ Pago en BTC confirmado por ${amountBTC} BTC\nHash: ${newTx.tx_hash}`;
      console.log(message);

      return {
        paid: true,
        txid: newTx.tx_hash,
        amount: amountBTC,
        message
      };

    } catch (err) {
      console.error("⚠️ Error consultando mempool.space BTC:", err.message);
    }

    await delay(5000);
  }
}
