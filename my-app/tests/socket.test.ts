import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { orderStatusEventSchema } from "../src/types/socket";

test("evento realtime acepta únicamente pedido, estado y fecha válidos", () => {
  const event = {
    orderId: randomUUID(),
    status: "ready",
    updatedAt: new Date().toISOString(),
  };
  assert.deepEqual(orderStatusEventSchema.parse(event), event);
  assert.equal(
    orderStatusEventSchema.safeParse({ ...event, orderId: "todos" }).success,
    false,
  );
  assert.equal(
    orderStatusEventSchema.safeParse({ ...event, status: "pending" }).success,
    false,
  );
});
