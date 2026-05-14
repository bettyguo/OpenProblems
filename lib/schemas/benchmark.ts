import { z } from "zod";

export const MetricDirectionSchema = z.enum(["higher-is-better", "lower-is-better"]);
export type MetricDirection = z.infer<typeof MetricDirectionSchema>;

export const BenchmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  dataset: z.string().min(1),
  metric: z.string().min(1),
  metric_direction: MetricDirectionSchema,
  upper_bound: z.number().optional(),
  protocol_url: z.string().url().optional(),
  notes: z.string().optional(),
});
export type Benchmark = z.infer<typeof BenchmarkSchema>;
