import { promotionsResponseSchema } from "../types/promotion";

export function createPromotionsClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  return async () => {
    if (!baseUrl) throw new Error("API no configurada");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(baseUrl + "/api/v1/promociones", {
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error("No se pudieron consultar los anuncios");
      return promotionsResponseSchema
        .parse(await response.json())
        .items.filter((p) => p.active);
    } finally {
      clearTimeout(timer);
    }
  };
}
