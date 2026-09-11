import type { CartItem, Product, OrderRequest } from "../types/product";

export const MAX_PRODUCTS = 3;
export const MAX_UNITS_PER_PRODUCT = 3;
export function cents(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Precio inválido");
  const [whole, fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result)) throw new Error("Precio fuera de rango");
  return result;
}
export function money(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value / 100);
}
export function cartKey(variantId: string, optionIds: string[]): string {
  return variantId + ":" + [...optionIds].sort().join(",");
}
export function selectionError(
  product: Product,
  variantId: string,
  optionIds: string[],
): string | null {
  if (
    !product.available ||
    !product.variants.some((v) => v.id === variantId && v.available)
  )
    return "Esta presentación ya no está disponible.";
  if (new Set(optionIds).size !== optionIds.length)
    return "No repitas una opción.";
  const available = product.modifier_groups.flatMap((group) =>
    group.options.filter((option) => option.available),
  );
  if (optionIds.some((id) => !available.some((option) => option.id === id)))
    return "Una opción ya no está disponible.";
  for (const group of product.modifier_groups) {
    const count = optionIds.filter((id) =>
      group.options.some((option) => option.id === id),
    ).length;
    if (count < group.min_selections || count > group.max_selections)
      return `${group.name}: elige entre ${group.min_selections} y ${group.max_selections} opciones.`;
  }
  return null;
}
export function makeLine(
  product: Product,
  variantId: string,
  optionIds: string[],
  quantity = 1,
): CartItem {
  const error = selectionError(product, variantId, optionIds);
  if (error) throw new Error(error);
  const variant = product.variants.find((v) => v.id === variantId)!;
  const options = product.modifier_groups
    .flatMap((g) => g.options)
    .filter((o) => optionIds.includes(o.id));
  return {
    key: cartKey(variantId, optionIds),
    productId: product.id,
    variantId,
    optionIds: [...optionIds].sort(),
    quantity,
    productName: product.name,
    image: product.image,
    presentationLabel: variant.label,
    volumeMl: variant.volume_ml,
    optionNames: options.map((o) => o.name),
    unitCents:
      cents(variant.price) + options.reduce((n, o) => n + cents(o.price), 0),
  };
}
export function limitError(cart: CartItem[]): string | null {
  const totals = new Map<string, number>();
  for (const line of cart) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1)
      return "Cantidad inválida.";
    totals.set(
      line.productId,
      (totals.get(line.productId) || 0) + line.quantity,
    );
  }
  if (totals.size > MAX_PRODUCTS)
    return "Puedes pedir hasta 3 productos distintos.";
  if ([...totals.values()].some((n) => n > MAX_UNITS_PER_PRODUCT))
    return "Puedes pedir hasta 3 unidades del mismo producto, sumando tamaños y opciones.";
  return null;
}
export function addLine(cart: CartItem[], line: CartItem): CartItem[] {
  const exists = cart.some((item) => item.key === line.key);
  const next = exists
    ? cart.map((item) =>
        item.key === line.key
          ? { ...item, quantity: item.quantity + line.quantity }
          : item,
      )
    : [...cart, line];
  const error = limitError(next);
  if (error) throw new Error(error);
  return next;
}
export function validateCart(
  cart: CartItem[],
  products: Product[],
): string | null {
  if (!cart.length) return "Agrega un producto al carrito.";
  const limit = limitError(cart);
  if (limit) return limit;
  for (const line of cart) {
    const product = products.find((p) => p.id === line.productId);
    if (!product)
      return `${line.productName} ya no está disponible. Retíralo del carrito.`;
    const error = selectionError(product, line.variantId, line.optionIds);
    if (error) return `${line.productName}: ${error}`;
  }
  return null;
}
export function refreshCart(cart: CartItem[], products: Product[]): CartItem[] {
  return cart.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product || selectionError(product, line.variantId, line.optionIds))
      return line;
    return makeLine(product, line.variantId, line.optionIds, line.quantity);
  });
}
export function totalCents(cart: CartItem[]): number {
  return cart.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
}
export function orderBody(cart: CartItem[]): OrderRequest {
  return {
    items: cart.map((line) => ({
      variant_id: line.variantId,
      quantity: line.quantity,
      option_ids: [...line.optionIds],
    })),
  };
}
export const statusLabels = {
  new: "Recibido",
  preparing: "En preparación",
  ready: "Listo para recoger",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
