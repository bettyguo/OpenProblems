import { z } from "zod";
import { isoDate } from "@/lib/schemas/_primitives";

export const LeaderboardEntrySchema = z.object({
  paper_id: z.string().min(1),
  benchmark_id: z.string().min(1),
  score: z.number(),
  date: isoDate,
  verified: z.boolean(),
  protocol_notes: z.string().optional(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
