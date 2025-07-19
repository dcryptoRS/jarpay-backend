import axios from "axios";

export async function checkBTC(address) {
  try {
    const res = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    const txs = res.data.slice(0, 3); // solo los 3 más recientes

    for (const tx of txs) {
      const isReceived = tx.vout.some(v => v.scriptpubkey_address === address);
      if (isReceived) {
        return {
          paid: true,
          txid: tx.txid
        };
      }
    }

    return { paid: false };
  } catch (err) {
    console.error("BTC check error:", err.message);
    return { paid: false };
  }
}
