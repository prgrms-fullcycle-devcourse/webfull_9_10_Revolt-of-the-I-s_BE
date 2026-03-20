import dotenv from "dotenv";
dotenv.config();

import pool from "./config/db";
import app from "./app";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("🔥 DB 연결 확인 완료");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("💥 DB 연결 실패:", err);
  }
}

start();
