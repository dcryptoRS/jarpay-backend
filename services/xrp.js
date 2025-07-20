import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Revisa si hay una nueva transacción confirmada hacia una address XRP.
 * Reintenta cada 5 segundos hasta 10 minutos.
 * 
 * @param {string} address Dirección XRP a monitorear
 * @param {string|null} lastConfirmedTxId Hash de la última transacción confirmada, para evitar repeticiones
 * @returns {object} { paid, txid, amount, message } o { paid: false, error }
 */
export async function checkXRP(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones en XRPSCAN...");
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
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data.transactions;

      if (!Array.isArray(txs)) {
        console.log("⚠️ XRPSCAN no devolvió una lista válida de transacciones:", txs);
        await delay(5000);
        continue;
      }

      // Filtrar solo pagos exitosos a esta dirección
      const validPayments = txs.filter(tx =>
        tx.TransactionType === "Payment" &&
        tx.Destination === address &&
        tx.meta?.TransactionResult === "tesSUCCESS"
      );

      if (validPayments.length === 0) {
        console.log("⏳ Sin transacciones válidas nuevas...");
        await delay(5000);
        continue;
      }

      // Ordenar por fecha descendente para buscar la tx más reciente
      validPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Buscar la primera transacción diferente a la última confirmada
      const newPaymentTx = validPayments.find(tx => tx.hash !== lastConfirmedTxId);

      if (!newPaymentTx) {
        console.log("⏳ No se encontró transacción nueva distinta a la última confirmada.");
        await delay(5000);
        continue;
      }

      let amount;
      const amt = newPaymentTx.Amount;

      if (typeof amt === "string") {
        amount = Number(amt) / 1_000_000;
      } else if (typeof amt === "object" && amt.currency === "XRP") {
        amount = parseFloat(amt.value);
      } else {
        amount = "Desconocido";
      }

      const mensaje = `✅ Transacción confirmada: ${amount} XRP recibidos.\nHash: ${newPaymentTx.hash}`;
      console.log(mensaje);

      return {
        paid: true,
        txid: newPaymentTx.hash,
        amount,
        message: mensaje
      };

    } catch (err) {
      console.error("⚠️ Error consultando XRPSCAN:", err.message);
    }

    await delay(5000);
  }
}

