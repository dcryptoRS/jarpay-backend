import axios from "axios";

export async function checkUSDT(address) {
  try {
    const res = await axios.get(`https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=20&start=0&address=${address}`);
    const txs = res.data.data;

    const usdtTx = txs.find(tx =>
      tx.tokenInfo &&
      tx.tokenInfo.tokenAbbr === "USDT" &&
      tx.confirmed === true &&
      tx.toAddress === address
    );

    if (usdtTx) {
      return { paid: true, txid: usdtTx.hash };
    }

    return { paid: false };
  } catch (err) {
    console.error("USDT check error:", err.message);
    return { paid: false };
  }
}
