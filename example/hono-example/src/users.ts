import { Hono } from "hono";
import { z } from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";

const ParamsSchema = z.object({
  id: z.string().min(3),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
});

const users = new Hono().get(
  "/:id",
  describeRoute({
    description: "ユーザー情報を取得",
    responses: {
      200: {
        description: "成功",
        content: {
          "application/json": { schema: resolver(UserSchema) },
        },
      },
    },
  }),
  validator("param", ParamsSchema),
  (c) => {
    const param = c.req.valid("param");
    console.log({ param });
    return c.json({
      success: true,
      data: {
        id: "test",
        name: "tanaka",
      },
    });
  }
);

export default users;
