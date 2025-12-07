import type { AppType } from "./index.js";
import { hc } from "hono/client";

const client = hc<AppType>("http://localhost:3000/");
const res = await client.users[":id"].$get({
  param: {
    id: "test",
  },
});

const data = await res.json();


const res2 = await client.author.$get