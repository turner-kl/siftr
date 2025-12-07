import { Hono } from "hono";

const author = new Hono()
  .get("/", (c) => c.json("list authors"))
  .post("/", (c) => c.json("create an author", 201))
  .get("/:id", (c) => c.json(`get ${c.req.param("id")}`));

export default author;
