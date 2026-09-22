import { z } from "zod";

export const promotionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(25),
  title: z.string().trim().min(1).max(70),
  description: z.string().trim().min(1).max(180),
  image: z
    .string()
    .max(1000)
    .refine((value) => {
      if (!value || /^assets\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(value))
        return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    }),
  active: z.boolean(),
});
export type Promotion = z.infer<typeof promotionSchema>;
export const promotionsResponseSchema = z.object({
  items: z
    .array(promotionSchema)
    .max(12)
    .refine((items) => new Set(items.map((p) => p.id)).size === items.length),
});
export const welcomePromotion: Promotion = {
  id: "00000000-0000-4000-8000-000000000001",
  label: "TU PAUSA FAVORITA",
  title: "Un buen día empieza con Buster’s.",
  description:
    "Algo rico para acompañar tu día. Elige a tu gusto, lo preparamos para ti.",
  image: "",
  active: true,
};
