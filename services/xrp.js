import axios from "axios";

export async function checkXRP(address) {
  try {
    const res = await axios.get(`https://data.ripple.com/v2/accounts/${address}/transactions?type=Payment&result=tesSUCCESS&limit=5`);
    const txs = res.data.transactions;

    if (txs.length > 0) {
      return {
        paid: true,
        txid: txs[0].tx.hash
      };
    }

    return { paid: false };
  } catch (err) {
    console.error("XRP check error:", err.message);
    return { paid: false };
  }
}
