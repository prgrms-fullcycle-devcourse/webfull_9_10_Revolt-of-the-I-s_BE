import dotenv from "dotenv";
import app from "./app";
import "./config/db";

dotenv.config();

require("./config/pusher");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ################################################
  🛡️  Server listening on port: ${PORT}
  ################################################
  `);
});
