import { createStore } from "zustand/vanilla";
import type { CafeApi } from "../services/api-client";
import { ApiError } from "../services/api-client";
import {
  persistedSchema,
  ORDER_NOTES_MAX,
  type Product,
  type CartItem,
  type SavedOrder,
  type PendingOrder,
  type ShoppingSession,
  type CafeStatus,
} from "../types/product";
import {
  addLine,
  makeLine,
  limitError,
  refreshCart,
  validateCart,
  orderBody,
} from "../domain/cart";

export interface ShopDependencies {
  api: CafeApi;
  storage: {
    read(): Promise<string | null>;
    write(value: string): Promise<void>;
  };
  vault: {
    read(): Promise<ShoppingSession | null>;
    write(value: ShoppingSession): Promise<void>;
  };
  uuid(): string;
  now(): number;
}
export interface ShopState {
  cafeteria: CafeStatus | null;
  cafeError: string | null;
  refreshCafeStatus(): Promise<void>;
  products: Product[];
  cart: CartItem[];
  orderNotes: string;
  setOrderNotes(value: string): void;
  favoriteIds: string[];
  orders: SavedOrder[];
  pending: PendingOrder | null;
  hydrated: boolean;
  loading: boolean;
  catalogReady: boolean;
  catalogError: string | null;
  error: string | null;
  notice: string | null;
  storageError: string | null;
  submitting: boolean;
  cancellingOrderId: string | null;
  hydrate(): Promise<void>;
  loadCatalog(): Promise<boolean>;
  toggleFavorite(id: string): void;
  addToCart(productId: string, variantId: string, optionIds: string[]): boolean;
  changeQuantity(key: string, delta: number): void;
  removeFromCart(key: string): void;
  submitOrder(): Promise<SavedOrder | null>;
  refreshOrder(id: string): Promise<void>;
  cancelOrder(id: string): Promise<boolean>;
  clearMessage(): void;
  clearNotice(): void;
}
const message = (e: unknown) =>
  e instanceof Error ? e.message : "No se pudo completar la operación.";
export function createShopStore(deps: ShopDependencies) {
  let hydration: Promise<void> | undefined;
  let catalogTask: Promise<boolean> | undefined;
  let cafeTask: Promise<void> | undefined;
  let writes: Promise<void> = Promise.resolve();
  const refreshes = new Map<string, Promise<void>>();
  return createStore<ShopState>((set, get) => {
    function updateCafeStatus(cafeteria: CafeStatus) {
      const previous = get().cafeteria;
      if (
        !previous ||
        Date.parse(cafeteria.updated_at) >= Date.parse(previous.updated_at)
      ) {
        set({ cafeteria, cafeError: null });
      }
    }
    async function save() {
      const { cart, orderNotes, favoriteIds, orders, pending } = get();
      const value = JSON.stringify({
        version: 1,
        cart,
        orderNotes,
        favoriteIds,
        orders: orders.slice(0, 50),
        pending,
      });
      writes = writes.catch(() => {}).then(() => deps.storage.write(value));
      try {
        await writes;
      } catch {
        set({
          storageError:
            "No pudimos guardar este pedido en el dispositivo. Libera espacio o habilita el almacenamiento y vuelve a abrir la app.",
        });
        throw new Error("No se pudo guardar el pedido.");
      }
    }
    function remember() {
      void save().catch(() => {});
    }
    function editable() {
      if (!get().hydrated || get().storageError) {
        set({ error: "El almacenamiento todavía no está disponible." });
        return false;
      }
      if (get().pending || get().submitting) {
        set({
          error:
            "Primero confirma el resultado del pedido pendiente desde el carrito.",
        });
        return false;
      }
      return true;
    }
    return {
      cafeteria: null,
      cafeError: null,
      refreshCafeStatus: () =>
        (cafeTask ??= (async () => {
          try {
            updateCafeStatus(await deps.api.cafeStatus());
          } catch {
            set({
              cafeError:
                "No pudimos comprobar si la cafetería está abierta. Actualiza el estado antes de pedir.",
            });
          } finally {
            cafeTask = undefined;
          }
        })()),
      products: [],
      cart: [],
      orderNotes: "",
      setOrderNotes: (value) => {
        if (!editable()) return;
        if (value.length > ORDER_NOTES_MAX || value.includes("\u0000")) {
          set({
            error: "Escribe indicaciones válidas de hasta 500 caracteres.",
          });
          return;
        }
        set({ orderNotes: value, error: null, notice: null });
        remember();
      },
      favoriteIds: [],
      orders: [],
      pending: null,
      hydrated: false,
      loading: false,
      catalogReady: false,
      catalogError: null,
      error: null,
      notice: null,
      storageError: null,
      submitting: false,
      cancellingOrderId: null,
      clearMessage: () => set({ error: null, notice: null }),
      clearNotice: () => set({ notice: null }),
      hydrate: () =>
        (hydration ??= (async () => {
          try {
            const raw = await deps.storage.read();
            if (raw) {
              const data = persistedSchema.parse(JSON.parse(raw));
              set({
                cart: data.cart,
                orderNotes: data.orderNotes,
                favoriteIds: data.favoriteIds,
                orders: data.orders,
                pending: data.pending,
              });
            }
            set({ hydrated: true });
          } catch {
            set({
              hydrated: true,
              storageError:
                "No pudimos recuperar los datos guardados. No envíes otro pedido hasta revisar el pedido anterior con la cafetería.",
            });
          }
        })()),
      loadCatalog: () =>
        (catalogTask ??= (async () => {
          set({ loading: true, catalogError: null });
          try {
            const { products, cafeteria } = await deps.api.catalog();
            updateCafeStatus(cafeteria);
            set({ products, catalogReady: true });
            return true;
          } catch (e) {
            set({ catalogError: message(e) });
            return false;
          } finally {
            set({ loading: false });
            catalogTask = undefined;
          }
        })()),
      toggleFavorite: (id) => {
        if (!get().hydrated || get().storageError) return;
        set({
          favoriteIds: get().favoriteIds.includes(id)
            ? get().favoriteIds.filter((x) => x !== id)
            : [...get().favoriteIds, id],
        });
        remember();
      },
      addToCart: (productId, variantId, optionIds) => {
        if (!editable()) return false;
        try {
          const product = get().products.find((p) => p.id === productId);
          if (!product) throw new Error("El producto ya no está disponible.");
          set({
            cart: addLine(get().cart, makeLine(product, variantId, optionIds)),
            error: null,
            notice: `${product.name} agregado al carrito.`,
          });
          remember();
          return true;
        } catch (e) {
          set({ error: message(e), notice: null });
          return false;
        }
      },
      changeQuantity: (key, delta) => {
        if (!editable() || ![-1, 1].includes(delta)) return;
        const next = get()
          .cart.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + delta }
              : item,
          )
          .filter((item) => item.quantity > 0);
        const error = limitError(next);
        if (error) {
          set({ error, notice: null });
          return;
        }
        set({ cart: next, error: null, notice: null });
        remember();
      },
      removeFromCart: (key) => {
        if (editable()) {
          set({
            cart: get().cart.filter((item) => item.key !== key),
            error: null,
            notice: null,
          });
          remember();
        }
      },
      submitOrder: async () => {
        if (get().submitting || !get().hydrated || get().storageError)
          return null;
        set({ submitting: true, error: null, notice: null });
        try {
          let pending = get().pending;
          let session = await deps.vault.read();
          if (!pending) {
            if (!(await get().loadCatalog()))
              throw new Error(
                "No pudimos comprobar los precios y la disponibilidad. Intenta de nuevo.",
              );
            if (!get().cafeteria?.is_open || get().cafeError) {
              throw new Error(
                "La cafetería está cerrada o no pudimos confirmar su apertura. Tu carrito se conserva para cuando vuelva a recibir pedidos.",
              );
            }
            const { cart, products } = get();
            const invalid = validateCart(cart, products);
            if (invalid) throw new Error(invalid);
            const updated = refreshCart(cart, products);
            if (
              updated.some((item, i) => item.unitCents !== cart[i].unitCents)
            ) {
              set({
                cart: updated,
                notice:
                  "Cambió un precio. Revisa el nuevo total y confirma otra vez.",
              });
              await save();
              return null;
            }
            if (
              !session ||
              Date.parse(session.expires_at) <= deps.now() + 60000
            ) {
              session = {
                ...(await deps.api.createSession()),
                localId: deps.uuid(),
              };
              await deps.vault.write(session);
            }
            pending = {
              key: deps.uuid(),
              sessionId: session.localId,
              body: {
                ...orderBody(updated),
                ...(get().orderNotes.trim()
                  ? { notes: get().orderNotes.trim() }
                  : {}),
              },
              createdAt: new Date(deps.now()).toISOString(),
            };
            set({ pending, cart: updated });
            // Persist the exact request and key before POST so a lost response can be retried.
            await save();
          }
          if (
            !session ||
            session.localId !== pending.sessionId ||
            Date.parse(session.expires_at) <= deps.now()
          )
            throw new Error(
              "La sesión del pedido pendiente ya no está disponible. Consulta con la cafetería antes de hacer otro pedido.",
            );
          let response;
          try {
            response = await deps.api.createOrder(
              pending.body,
              session.token,
              pending.key,
            );
          } catch (error) {
            // Un 401 se produce antes de crear el pedido. Es seguro renovar la
            // sesión y conservar el mismo cuerpo y clave de idempotencia.
            if (!(error instanceof ApiError) || error.status !== 401)
              throw error;
            session = {
              ...(await deps.api.createSession()),
              localId: deps.uuid(),
            };
            await deps.vault.write(session);
            pending = { ...pending, sessionId: session.localId };
            set({ pending });
            await save();
            response = await deps.api.createOrder(
              pending.body,
              session.token,
              pending.key,
            );
          }
          const order = {
            ...response,
            sessionId: session.localId,
            checkedAt: new Date(deps.now()).toISOString(),
          };
          set({
            orders: [
              order,
              ...get().orders.filter((o) => o.id !== order.id),
            ].slice(0, 50),
            cart: [],
            orderNotes: "",
            pending: null,
          });
          await save();
          return order;
        } catch (e) {
          if (
            e instanceof ApiError &&
            ([400, 413].includes(e.status) ||
              e.code === "ORDER_REJECTED" ||
              e.code === "CAFE_CLOSED")
          ) {
            set({ pending: null });
            if (e.code === "CAFE_CLOSED") {
              const cafeteria = get().cafeteria;
              set({
                cafeteria: cafeteria ? { ...cafeteria, is_open: false } : null,
              });
              void get().refreshCafeStatus();
            }
            await save().catch(() => {});
            void get().loadCatalog();
          }
          // A 409 may refer to an already-used key; never silently start a different order.
          set({ error: message(e) });
          return null;
        } finally {
          set({ submitting: false });
        }
      },
      refreshOrder: (id) => {
        const existing = refreshes.get(id);
        if (existing) return existing;
        const task = (async () => {
          try {
            const saved = get().orders.find((o) => o.id === id);
            if (!saved)
              throw new Error(
                "Este pedido no está guardado en el dispositivo.",
              );
            const session = await deps.vault.read();
            if (
              !session ||
              session.localId !== saved.sessionId ||
              Date.parse(session.expires_at) <= deps.now()
            )
              throw new Error(
                "La sesión de consulta terminó. Se muestra el último estado guardado.",
              );
            const order = await deps.api.getOrder(id, session.token);
            set({
              orders: get().orders.map((o) =>
                o.id === id
                  ? {
                      ...order,
                      sessionId: saved.sessionId,
                      checkedAt: new Date(deps.now()).toISOString(),
                    }
                  : o,
              ),
              error: null,
            });
            await save();
          } catch (e) {
            set({
              error:
                e instanceof ApiError && e.status === 401
                  ? "La sesión de consulta terminó. Se muestra el último estado guardado."
                  : message(e),
            });
          } finally {
            refreshes.delete(id);
          }
        })();
        refreshes.set(id, task);
        return task;
      },
      cancelOrder: async (id) => {
        if (get().cancellingOrderId) return false;
        const saved = get().orders.find((order) => order.id === id);
        if (!saved || saved.status !== "new") {
          set({ error: "Este pedido ya no se puede cancelar desde la app." });
          return false;
        }
        set({ cancellingOrderId: id, error: null, notice: null });
        try {
          const session = await deps.vault.read();
          if (!session || session.localId !== saved.sessionId)
            throw new Error(
              "No se encontró la sesión original del pedido. Solicita apoyo en la cafetería.",
            );
          const order = await deps.api.cancelOrder(id, session.token);
          set({
            orders: get().orders.map((item) =>
              item.id === id
                ? {
                    ...order,
                    sessionId: saved.sessionId,
                    checkedAt: new Date(deps.now()).toISOString(),
                  }
                : item,
            ),
            notice: `Pedido ${order.folio} cancelado.`,
          });
          await save();
          return true;
        } catch (e) {
          set({ error: message(e) });
          if (e instanceof ApiError && e.status === 409)
            void get().refreshOrder(id);
          return false;
        } finally {
          set({ cancellingOrderId: null });
        }
      },
    };
  });
}
