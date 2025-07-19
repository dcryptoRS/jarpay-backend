import axios from "axios";

export async function checkXRP(address) {
  try {
    const url = `https://api.xrpscan.com/api/v1/account/${address}/transactions`;
    const res = await axios.get(url);

    const txs = res.data.transactions;

    if (!Array.isArray(txs)) {
      throw new Error("Respuesta inesperada de XRPSCAN");
    }

    const paymentTx = txs.find(tx =>
      tx.tx &&
      tx.tx.TransactionType === "Payment" &&
      tx.tx.Destination === address &&
      tx.meta?.TransactionResult === "tesSUCCESS"
    );

    if (paymentTx) {
      const amount = parseFloat(paymentTx.tx.Amount) / 1_000_000; // en XRP
      return {
        paid: true,
        txid: paymentTx.hash,
        amount,
        message: `✅ Transacción confirmada: se recibieron ${amount} XRP.`
      };
    }

    return { paid: false, message: "⏳ Aún no se ha detectado una transacción confirmada." };
  } catch (err) {
    console.error("XRPSCAN check error:", err.message);
    return { paid: false, message: "❌ Error al consultar la API de XRPSCAN." };
  }
}
