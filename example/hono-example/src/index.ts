import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import author from "./author.js";
import users from "./users.js"
import { openAPIRouteHandler } from 'hono-openapi'

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const routes = app.route("/users", users).route("/author", author);

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Hono API',
        version: '1.0.0',
        description: 'Greeting API',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Server' },
      ],
    },
  })
);

app.get('/docs', Scalar({ url: '/openapi' }))

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

export type AppType = typeof routes;
