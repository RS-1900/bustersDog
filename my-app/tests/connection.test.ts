import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveApiUrl } from "../src/services/resolve-api-url";
test("Expo Go descubre la API en la computadora, no en el teléfono", () => {
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "android",
      hostUri: "192.168.100.254:8082",
    }),
    "http://192.168.100.254:5000",
  );
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "ios",
      hostUri: "10.1.2.3:8081",
    }),
    "http://10.1.2.3:5000",
  );
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "android",
      hostUri: "localhost:8081",
    }),
    "http://10.0.2.2:5000",
  );
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "web",
      webHostname: "192.168.100.254",
    }),
    "http://192.168.100.254:5000",
  );
});
test("URL explícita prevalece; publicación y túneles no adivinan una API", () => {
  assert.equal(
    resolveApiUrl({
      development: false,
      platform: "android",
      configuredUrl: " https://api.example.com/ ",
    }),
    "https://api.example.com",
  );
  assert.equal(
    resolveApiUrl({
      development: false,
      platform: "android",
      hostUri: "192.168.1.2:8081",
    }),
    "",
  );
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "android",
      hostUri: "demo.exp.direct:80",
    }),
    "",
  );
  assert.equal(
    resolveApiUrl({
      development: true,
      platform: "web",
      webHostname: "example.com",
    }),
    "",
  );
  for (const configuredUrl of [
    "no-url",
    "http://user:password@example.com",
    "https://example.com/api",
    "https://example.com?secret=x",
  ])
    assert.equal(
      resolveApiUrl({
        development: true,
        platform: "android",
        configuredUrl,
        hostUri: "192.168.1.2:8081",
      }),
      "",
    );
});

import { createUuid } from "../src/services/uuid";
test("UUID del pedido funciona sin randomUUID/subtle y mantiene los bits de versión", () => {
  let requested = 0;
  const uuid = createUuid((bytes) => {
    requested = bytes.length;
    return bytes.fill(255);
  });
  assert.equal(requested, 16);
  assert.equal(uuid, "ffffffff-ffff-4fff-bfff-ffffffffffff");
});
