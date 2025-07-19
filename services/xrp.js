import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkXRP(address) {
  let confirmedTx = null;

  console.log("🔍 Buscando transacción confirmada en XRPSCAN...");

  while (!confirmedTx) {
    try {
      const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
      const txs = res.data;

      if (Array.isArray(txs)) {
        const paymentTx = txs.find(tx => {
          const isPayment = tx.tx.TransactionType === "Payment";
          const isToAddress = tx.tx.Destination === address;
          const isConfirmed = tx.meta.TransactionResult === "tesSUCCESS";

          return isPayment && isToAddress && isConfirmed;
        });

        if (paymentTx) {
          let amount;
          const amt = paymentTx.tx.Amount;

          if (typeof amt === "string") {
            amount = Number(amt) / 1_000_000; // drops → XRP
          } else if (typeof amt === "object" && amt.currency === "XRP") {
            amount = parseFloat(amt.value);
          } else {
            amount = "Desconocido";
          }

          confirmedTx = {
            paid: true,
            txid: paymentTx.hash,
            amount,
            message: `✅ Transacción confirmada: ${amount} XRP recibidos en ${address}`
          };
          break;
        }
      }

    } catch (err) {
      console.error("XRPSCAN check error:", err.message);
    }

    await delay(5000);
  }

  return confirmedTx;
}
