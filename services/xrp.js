import axios from "axios";

export async function checkXRP(address) {
  try {
    const res = await axios.get(`https://data.ripple.com/v2/accounts/${address}/transactions?type=Payment&result=tesSUCCESS&limit=3`);
    const txs = res.data.transactions;

    for (const tx of txs) {
      const txData = tx.tx;
      if (txData.Destination === address) {
        // Cualquier pago recibido confirmado cuenta
        return {
          paid: true,
          txid: txData.hash
        };
      }
    }

    return { paid: false };
  } catch (err) {
    console.error("XRP check error:", err.message);
    return { paid: false };
  }
}
