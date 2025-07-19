import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkXRP(address, lastConfirmedTxId = null) {
  console.log("🔍 Buscando transacción confirmada en XRPSCAN...");

  const timeoutMs = 5 * 60 * 1000; // 5 minutos
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      return {
        paid: false,
        error: "Timeout: no se detectó una nueva transacción en 5 minutos."
      };
    }

    try {
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data.transactions;

      if (!Array.isArray(txs)) {
        console.log("❌ XRPSCAN no devolvió una lista de transacciones:", txs);
        await delay(5000);
        continue;
      }

      // Filtrar pagos exitosos hacia esta dirección
      const paymentTx = txs.find(tx =>
        tx.TransactionType === "Payment" &&
        tx.Destination === address &&
        tx.meta?.TransactionResult === "tesSUCCESS" &&
        tx.hash !== lastConfirmedTxId // Ignorar txs repetidas
      );

      if (paymentTx) {
        let amount;
        const amt = paymentTx.Amount;

        if (typeof amt === "string") {
          amount = Number(amt) / 1_000_000;
        } else if (typeof amt === "object" && amt.currency === "XRP") {
          amount = parseFloat(amt.value);
        } else {
          amount = "Desconocido";
        }

        return {
          paid: true,
          txid: paymentTx.hash,
          amount,
          message: `✅ Transacción confirmada: ${amount} XRP recibidos en ${address}`
        };
      }

    } catch (err) {
      console.error("⚠️ XRPSCAN error:", err.message);
    }

    await delay(5000);
  }
}

