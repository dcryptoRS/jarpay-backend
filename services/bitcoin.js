import axios from "axios";

export async function checkBTC(address) {
  try {
    const res = await axios.get(`https://mempool.space/api/address/${address}`);
    const txs = res.data.txrefs || [];

    if (txs.length > 0) {
      const amountBTC = txs[0].value / 1e8; // convertir satoshis a BTC
      return {
        paid: true,
        txid: txs[0].tx_hash,
        amount: amountBTC,
        message: `Pago en BTC confirmado por ${amountBTC} BTC`
      };
    }

    return { paid: false, message: "No se ha detectado un pago en BTC" };
  } catch (err) {
    console.error("BTC check error:", err.message);
    return { paid: false, message: "Error al verificar BTC" };
  }
}
