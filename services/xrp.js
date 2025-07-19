import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkXRP(address) {
  console.log("🔍 Buscando transacción confirmada en XRPSCAN...");

  while (true) {
    try {
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data.transactions;

      if (!Array.isArray(txs)) {
        console.log("❌ XRPSCAN no devolvió una lista de transacciones:", txs);
        await delay(5000);
        continue;
      }

      for (const tx of txs) {
        console.log("🧾 Revisando TX:", {
          hash: tx.hash,
          destination: tx.Destination,
          type: tx.TransactionType,
          result: tx.meta?.TransactionResult,
        });
      }

      const paymentTx = txs.find(tx =>
        tx.TransactionType === "Payment" &&
        tx.Destination === address &&
        tx.meta?.TransactionResult === "tesSUCCESS"
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
