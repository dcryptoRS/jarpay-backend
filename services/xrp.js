import axios from "axios";

export async function checkXRP(address) {
  try {
    const url = `https://api.xrpscan.com/api/v1/account/${address}/transactions`;
    const res = await axios.get(url);

    const txs = res.data;

    // Buscar la primera transacción de tipo Payment confirmada
    const paymentTx = txs.find(tx =>
      tx.tx.TransactionType === "Payment" &&
      tx.tx.Destination === address &&
      tx.meta?.TransactionResult === "tesSUCCESS"
    );

    if (paymentTx) {
      const amount = paymentTx.tx.Amount / 1000000; // convertir drops a XRP
      return {
        paid: true,
        txid: paymentTx.hash,
        amount: amount,
        message: `Pago recibido de ${amount} XRP. Transacción confirmada exitosamente.`
      };
    }

    return { paid: false, message: "Aún no se ha detectado una transacción confirmada." };
  } catch (err) {
    console.error("XRPSCAN check error:", err.message);
    return { paid: false, message: "Error al consultar la API de XRPSCAN." };
  }
}
