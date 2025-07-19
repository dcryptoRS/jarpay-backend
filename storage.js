import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function saveTransaction(txid, currency, address) {
  await pool.query(
    `INSERT INTO transactions (txid, currency, address) VALUES ($1, $2, $3)
     ON CONFLICT (txid) DO NOTHING`,
    [txid, currency, address]
  );
}

export async function isTransactionProcessed(txid) {
  const res = await pool.query("SELECT 1 FROM transactions WHERE txid = $1", [txid]);
  return res.rowCount > 0;
}
