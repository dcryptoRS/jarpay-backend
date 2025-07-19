import axios from "axios";

export async function checkXRP(address) {
  try {
    const res = await axios.get(`https://data.ripple.com/v2/accounts/${address}/transactions`);
    const txs = res.data.transactions;

    if (txs.length > 0) {
      const tx = txs[0].tx;
      // El monto en XRP viene en 'Amount' que es string numérica en drops (1 XRP = 1,000,000 drops)
      const amountXRP = parseFloat(tx.Amount) / 1_000_000;

      return {
        paid: true,
        txid: tx.hash,
        amount: amountXRP,
        message: `Transacción XRP confirmada por ${amountXRP} XRP`
      };
    }

    return {
      paid: false,
      message: "No se ha detectado ninguna transacción XRP en esta wallet"
    };
  } catch (err) {
    console.error("XRP check error:", err.message);
    return {
      paid: false,
      message: "Error al consultar las transacciones XRP"
    };
  }
}
