import { z } from "zod";

export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((value) => Number(value) <= 9999999999.99);
const uuid = z.string().uuid();
export const variantSchema = z.object({
  id: uuid,
  presentation_id: uuid,
  label: z.string(),
  volume_ml: z.number().int().positive().nullable(),
  price: amountSchema,
  available: z.boolean(),
});
export const optionSchema = z.object({
  id: uuid,
  name: z.string(),
  price: amountSchema,
  available: z.boolean(),
});
export const groupSchema = z.object({
  id: uuid,
  name: z.string(),
  min_selections: z.number().int().min(0),
  max_selections: z.number().int().positive(),
  options: z.array(optionSchema),
});
export const productSchema = z.object({
  id: uuid,
  name: z.string(),
  description: z.string(),
  image: z.string(),
  category_id: uuid,
  category: z.string(),
  price: amountSchema,
  available: z.boolean(),
  variants: z.array(variantSchema),
  modifier_groups: z.array(groupSchema),
});
export const catalogSchema = z.object({
  currency: z.literal("MXN"),
  products: z.array(productSchema),
});
export const sessionSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  expires_at: z.string().datetime(),
});
export const orderItemSchema = z.object({
  id: uuid,
  variant_id: uuid,
  product_name: z.string(),
  presentation_label: z.string(),
  volume_ml: z.number().nullable(),
  quantity: z.number().int().positive(),
  base_price: amountSchema,
  unit_price: amountSchema,
  line_total: amountSchema,
  options: z.array(
    z.object({
      option_id: uuid,
      group_name: z.string(),
      option_name: z.string(),
      price: amountSchema,
    }),
  ),
});
export const orderSchema = z.object({
  id: uuid,
  folio: z.string(),
  status: z.enum(["new", "preparing", "ready", "delivered", "cancelled"]),
  currency: z.literal("MXN"),
  total: amountSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  items: z.array(orderItemSchema),
});
export const requestSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: uuid,
        quantity: z.number().int().min(1).max(3),
        option_ids: z.array(uuid),
      }),
    )
    .min(1)
    .max(9),
});
export type Product = z.infer<typeof productSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderRequest = z.infer<typeof requestSchema>;
export type ShoppingSession = z.infer<typeof sessionSchema> & {
  localId: string;
};
export type CategoryType = string;

export const cartLineSchema = z.object({
  key: z.string(),
  productId: uuid,
  variantId: uuid,
  optionIds: z.array(uuid),
  quantity: z.number().int().min(1).max(3),
  productName: z.string(),
  image: z.string(),
  presentationLabel: z.string(),
  volumeMl: z.number().nullable(),
  optionNames: z.array(z.string()),
  unitCents: z.number().int().nonnegative(),
});
export type CartItem = z.infer<typeof cartLineSchema>;
export const pendingSchema = z.object({
  key: uuid,
  sessionId: uuid,
  body: requestSchema,
  createdAt: z.string(),
});
export type PendingOrder = z.infer<typeof pendingSchema>;
export const savedOrderSchema = orderSchema.extend({
  sessionId: uuid,
  checkedAt: z.string(),
});
export type SavedOrder = z.infer<typeof savedOrderSchema>;
export const persistedSchema = z.object({
  version: z.literal(1),
  cart: z.array(cartLineSchema).max(9),
  favoriteIds: z.array(uuid),
  orders: z.array(savedOrderSchema).max(50),
  pending: pendingSchema.nullable(),
});
