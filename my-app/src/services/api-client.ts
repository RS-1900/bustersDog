import { z } from "zod";
import {
  catalogSchema,
  orderSchema,
  sessionSchema,
  type OrderRequest,
} from "../types/product";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public retryAfter = 0,
    public code?: string,
  ) {
    super(message);
  }
}
export function createApiClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestInit = {},
  ): Promise<T> {
    if (!baseUrl)
      throw new ApiError("No se ha configurado la conexión con la cafetería.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(baseUrl + path, {
        ...options,
        credentials: "omit",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Cafe-Request": "1",
          ...options.headers,
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const messages = z
          .object({
            error: z.string().optional(),
            code: z.string().optional(),
            details: z.array(z.object({ message: z.string() })).optional(),
          })
          .safeParse(data);
        const message = messages.success
          ? messages.data.details?.map((d) => d.message).join(" ") ||
            messages.data.error
          : null;
        throw new ApiError(
          message || "No se pudo completar la solicitud.",
          response.status,
          Number(response.headers.get("Retry-After")) || 0,
          messages.success ? messages.data.code : undefined,
        );
      }
      const parsed = schema.safeParse(data);
      if (!parsed.success)
        throw new ApiError(
          "La respuesta de la cafetería no tiene el formato esperado.",
          502,
        );
      return parsed.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "No pudimos confirmar la respuesta. Comprueba tu conexión y vuelve a intentar.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    catalog: () => request("/api/v1/catalogo", catalogSchema),
    createSession: () =>
      request("/api/v1/sesiones", sessionSchema, {
        method: "POST",
        body: "{}",
      }),
    createOrder: (body: OrderRequest, token: string, key: string) =>
      request("/api/v1/pedidos", orderSchema, {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Idempotency-Key": key },
        body: JSON.stringify(body),
      }),
    getOrder: (id: string, token: string) =>
      request("/api/v1/pedidos/" + encodeURIComponent(id), orderSchema, {
        headers: { Authorization: "Bearer " + token },
      }),
  };
}
export type CafeApi = ReturnType<typeof createApiClient>;
