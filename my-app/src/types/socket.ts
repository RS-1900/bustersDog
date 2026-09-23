import { z } from "zod";
import { orderStatusSchema } from "./product";

export const orderStatusEventSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusSchema,
  updatedAt: z.string().datetime(),
});

export type OrderStatusEvent = z.infer<typeof orderStatusEventSchema>;
