import axios from "axios";

// Espera 5 segundos
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkXRP(address) {
  let confirmedTx = null;

  console.log("⏳ Buscando transacción confirmada en XRPSCAN...");

  while (!confirmedTx) {
    try {
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data;

      if (Array.isArray(txs)) {
        // Buscamos la primera transacción confirmada de tipo "Payment"
        const paymentTx = txs.find(tx =>
          tx.tx.TransactionType === "Payment" &&
          tx.tx.Destination === address &&
          tx.meta.TransactionResult === "tesSUCCESS"
        );

        if (paymentTx) {
          confirmedTx = {
            paid: true,
            txid: paymentTx.hash,
            amount: Number(paymentTx.tx.Amount) / 1000000, // Convertimos drops a XRP
            message: `✅ Transacción confirmada: ${Number(paymentTx.tx.Amount) / 1000000} XRP recibidos.`
          };
          break;
        }
      } else {
        console.warn("⚠️ Respuesta inesperada de XRPSCAN:", txs);
      }

    } catch (err) {
      console.error("XRPSCAN check error:", err.message);
    }

    await delay(5000); // Espera 5 segundos antes de volver a consultar
  }

  return confirmedTx;
}
