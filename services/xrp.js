import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkXRP(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones en XRPSCAN...");
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
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data.transactions;

      if (!Array.isArray(txs)) {
        console.log("⚠️ XRPSCAN no devolvió una lista válida de transacciones:", txs);
        await delay(5000);
        continue;
      }

      // Filtrar transacciones de pago exitosas que NO sean la última confirmada
      const newTxs = txs.filter(tx =>
        tx.TransactionType === "Payment" &&
        tx.Destination === address &&
        tx.meta?.TransactionResult === "tesSUCCESS" &&
        tx.hash !== lastConfirmedTxId
      );

      if (newTxs.length === 0) {
        console.log("⏳ No se encontró ninguna transacción XRP nueva distinta a la última confirmada.");
        await delay(5000);
        continue;
      }

      // Devolver la más reciente (por orden de aparición)
      const paymentTx = newTxs[0];

      let amount;
      const amt = paymentTx.Amount;

      if (typeof amt === "string") {
        amount = Number(amt) / 1_000_000;
      } else if (typeof amt === "object" && amt.currency === "XRP") {
        amount = parseFloat(amt.value);
      } else {
        amount = "Desconocido";
      }

      const mensaje = `✅ Transacción confirmada: ${amount} XRP recibidos.\nHash: ${paymentTx.hash}`;
      console.log(mensaje);

      return {
        paid: true,
        txid: paymentTx.hash,
        amount,
        message: mensaje
      };
    } catch (err) {
      console.error("⚠️ Error consultando XRPSCAN:", err.message);
    }

    await delay(5000);
  }
}

