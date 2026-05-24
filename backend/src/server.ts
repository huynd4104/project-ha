import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Backend đang chạy tại http://localhost:${env.port}`);
});
