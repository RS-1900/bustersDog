// getRandomValues is available on LAN HTTP pages too; randomUUID/subtle are not.
// The caller must supply a cryptographic random source, never Math.random.
export function createUuid(fill: (bytes: Uint8Array) => Uint8Array): string {
  const bytes = fill(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
