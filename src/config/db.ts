import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("✅ DB 성공! (Connected to Postgres)");
});

pool.on("error", (err) => {
  console.error("❌ DB에 문제가 생겼어요:", err);
});

export default pool;
