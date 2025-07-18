import axios from "axios";

export async function checkBTC(address) {
  try {
    const res = await axios.get(`https://mempool.space/api/address/${address}`);
    const txs = res.data.chain_stats.funded_txo_count > 0 ? res.data.chain_stats : null;
    
    if (txs) {
      return {
        paid: true,
        txid: "unknown_txid"
      };
    }
    return { paid: false };
  } catch (err) {
    console.error("BTC check error:", err.message);
    return { paid: false };
  }
}
