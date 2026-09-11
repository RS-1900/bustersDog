import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
for (const filename of [".env", ".env.local"]) {
  const file = path.join(appRoot, filename);
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
const candidates = Object.entries(os.networkInterfaces())
  .filter(
    ([name]) =>
      !/virtual|vmware|vethernet|docker|wsl|vpn|tailscale/i.test(name),
  )
  .sort(
    ([a], [b]) =>
      Number(/wi-?fi|wireless|wlan/i.test(b)) -
      Number(/wi-?fi|wireless|wlan/i.test(a)),
  )
  .flatMap(([, entries]) => entries || [])
  .filter(
    (i) =>
      i &&
      i.family === "IPv4" &&
      !i.internal &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address),
  );
const lan =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME || candidates[0]?.address;
if (!lan) {
  console.error(
    "No se encontró una dirección Wi-Fi local. Conecta la computadora a la red del teléfono.",
  );
  process.exit(1);
}
const port = process.env.EXPO_PORT || "8082";
const api = process.env.EXPO_PUBLIC_API_URL?.trim() || `http://${lan}:5000`;
const backend =
  process.env.CAFE_API_DIR ||
  path.resolve(appRoot, "../../../API_Express_TS-main/API_Express_TS-main");
let apiChild, expoChild;
async function available() {
  try {
    const response = await fetch(api + "/api/v1/catalogo", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.currency === "MXN" && Array.isArray(data.products);
  } catch {
    return false;
  }
}
function close() {
  expoChild?.kill();
  apiChild?.kill();
}
process.on("SIGINT", () => {
  close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  close();
  process.exit(0);
});
if (!(await available())) {
  const localHosts = new Set([lan, "localhost", "127.0.0.1"]);
  let local = false;
  try {
    const url = new URL(api);
    local = localHosts.has(url.hostname) && url.port === "5000";
  } catch {}
  const cli = path.join(backend, "node_modules/tsx/dist/cli.mjs");
  if (!local || !fs.existsSync(cli)) {
    console.error(
      "La API no responde. Iníciala o configura CAFE_API_DIR con su carpeta y EXPO_PUBLIC_API_URL con su dirección.",
    );
    process.exit(1);
  }
  const origins = [
    process.env.MOBILE_ORIGINS,
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    `http://${lan}:${port}`,
  ]
    .filter(Boolean)
    .join(",");
  apiChild = spawn(process.execPath, [cli, "src/server.ts"], {
    cwd: backend,
    stdio: "inherit",
    env: { ...process.env, PORT: "5000", MOBILE_ORIGINS: origins },
  });
  let ready = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    if (await available()) {
      ready = true;
      break;
    }
    if (apiChild.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) {
    console.error("No se pudo iniciar la API. Revisa su configuración local.");
    close();
    process.exit(1);
  }
}
console.log(
  `API comprobada: ${api}\nAbre este proyecto en Expo Go: exp://${lan}:${port}\nLa computadora y el teléfono deben permanecer en el mismo Wi-Fi.`,
);
expoChild = spawn(
  process.execPath,
  [
    path.join(appRoot, "node_modules/expo/bin/cli"),
    "start",
    "--lan",
    "--port",
    port,
    ...process.argv.slice(2),
  ],
  {
    cwd: appRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: api,
      REACT_NATIVE_PACKAGER_HOSTNAME: lan,
    },
  },
);
expoChild.on("exit", (code) => {
  apiChild?.kill();
  process.exit(code || 0);
});
