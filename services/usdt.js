import axios from "axios";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Revisa si hay una nueva transacción USDT confirmada en TRON hacia una dirección.
 * Reintenta cada 5 segundos hasta 10 minutos.
 */
export async function checkUSDT(address, lastConfirmedTxId = null) {
  console.log("🔍 Iniciando monitoreo de transacciones USDT (TRON)...");
  console.log(`📨 Dirección: ${address}`);
  console.log(`🕐 Esperando hasta 10 minutos, chequeando cada 5 segundos...`);

  const timeoutMs = 10 * 60 * 1000;
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      console.log("❌ Tiempo de espera agotado sin encontrar transacción nueva.");
      return {
        paid: false,
        error: "Timeout: no se detectó una nueva transacción en 10 minutos."
      };
    }

    try {
      const res = await axios.get(`https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=10&start=0&address=${address}`);
      const txs = res.data.data || [];

      if (!Array.isArray(txs) || txs.length === 0) {
        console.log("⏳ Sin transacciones USDT aún...");
        await delay(5000);
        continue;
      }

      // Filtrar solo USDT confirmados dirigidos a la dirección correcta
      const validTxs = txs.filter(tx => {
        const tokenInfo = tx.tokenInfo;
        const transferInfo = tx.tokenTransferInfo;

        return (
          tx.confirmed === true &&
          tokenInfo &&
          tokenInfo.tokenAbbr === "USDT" &&
          transferInfo &&
          transferInfo.to_address === address
        );
      });

      if (validTxs.length === 0) {
        console.log("⏳ Sin transacciones USDT confirmadas aún...");
        await delay(5000);
        continue;
      }

      // Ordenar por timestamp descendente (más reciente primero)
      validTxs.sort((a, b) => b.timestamp - a.timestamp);

      // Buscar la primera tx distinta a la última confirmada
      const newTx = validTxs.find(tx => tx.hash !== lastConfirmedTxId);

      if (!newTx) {
        console.log("⏳ No se encontró transacción USDT nueva distinta a la última confirmada.");
        await delay(5000);
        continue;
      }

      const amountUSDT = parseFloat(newTx.tokenTransferInfo.amount_str) / 10 ** newTx.tokenInfo.tokenDecimal;

      const message = `✅ Pago en USDT confirmado por ${amountUSDT} USDT\nHash: ${newTx.hash}`;
      console.log(message);

      return {
        paid: true,
        txid: newTx.hash,
        amount: amountUSDT,
        message
      };

    } catch (err) {
      console.error("⚠️ Error consultando Tronscan USDT:", err.message);
    }

    await delay(5000);
  }
}
