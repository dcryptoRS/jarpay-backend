import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Revisa si hay una nueva transacción confirmada hacia una dirección USDT (TRON).
 * Reintenta cada 5 segundos hasta 10 minutos.
 * 
 * @param {string} address Dirección TRON a monitorear
 * @param {string|null} lastConfirmedTxId Hash de la última transacción confirmada, para evitar repeticiones
 * @returns {object} { paid, txid, amount, message } o { paid: false, error }
 */
export async function checkUSDT(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones USDT (TRON)...");
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
      const res = await axios.get(`https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=10&start=0&address=${address}`);
      const txs = res.data.data || [];

      if (!Array.isArray(txs) || txs.length === 0) {
        console.log("⏳ Sin transacciones USDT aún...");
        await delay(5000);
        continue;
      }

      // Filtrar solo USDT confirmados a esta dirección
      const validTxs = txs.filter(tx =>
        tx.tokenInfo &&
        tx.tokenInfo.tokenAbbr === "USDT" &&
        tx.confirmed === true &&
        tx.toAddress === address
      );

      if (validTxs.length === 0) {
        console.log("⏳ Sin transacciones USDT confirmadas aún...");
        await delay(5000);
        continue;
      }

      // Ordenar por fecha descendente para encontrar la tx más reciente
      validTxs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Buscar la primera tx diferente a la última confirmada
      const newTx = validTxs.find(tx => tx.hash !== lastConfirmedTxId);

      if (!newTx) {
        console.log("⏳ No se encontró transacción USDT nueva distinta a la última confirmada.");
        await delay(5000);
        continue;
      }

      const amountUSDT = parseFloat(newTx.tokenTransferInfo.amount_str) / 10 ** newTx.tokenInfo.tokenDecimal;

      const message = `✅ Pago en USDT confirmado por ${amountUSDT} USDT\nHash: ${newTx.hash}`;
      console.log(message);

      return {
        paid: true,
        txid: newTx.hash,
        amount: amountUSDT,
        message
      };

    } catch (err) {
      console.error("⚠️ Error consultando Tronscan USDT:", err.message);
    }

    await delay(5000);
  }
}
