import axios from "axios";

export async function checkUSDT(address) {
  try {
    const res = await axios.get(`https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=3&start=0&address=${address}`);
    const txs = res.data.data;

    const usdtTx = txs.find(tx =>
      tx.tokenInfo &&
      tx.tokenInfo.tokenAbbr === "USDT" &&
      tx.confirmed === true &&
      tx.toAddress === address
    );

    if (usdtTx) {
      const amountUSDT = parseFloat(usdtTx.tokenTransferInfo.amount_str) / 10 ** usdtTx.tokenInfo.tokenDecimal;

      return {
        paid: true,
        txid: usdtTx.hash,
        amount: amountUSDT,
        message: `Pago en USDT confirmado por ${amountUSDT} USDT`
      };
    }

    return { paid: false, message: "No se ha detectado un pago en USDT" };
  } catch (err) {
    console.error("USDT check error:", err.message);
    return { paid: false, message: "Error al verificar USDT" };
  }
}
