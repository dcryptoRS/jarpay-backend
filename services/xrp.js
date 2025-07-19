import axios from "axios";

export async function checkXRP(address) {
  try {
    const res = await axios.get(`https://data.ripple.com/v2/accounts/${address}/transactions?type=Payment&result=tesSUCCESS&limit=3`);
    const txs = res.data.transactions;

    if (txs.length > 0) {
      const tx = txs[0].tx;
      const amountXRP = parseFloat(tx.Amount) / 1e6;

      return {
        paid: true,
        txid: tx.hash,
        amount: amountXRP,
        message: `Pago en XRP confirmado por ${amountXRP} XRP`
      };
    }

    return { paid: false, message: "No se ha detectado un pago en XRP" };
  } catch (err) {
    console.error("XRP check error:", err.message);
    return { paid: false, message: "Error al verificar XRP" };
  }
}
