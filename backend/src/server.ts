import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚗 SaaS Auto API listening on http://localhost:${env.PORT}`);
});
