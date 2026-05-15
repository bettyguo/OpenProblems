import { stubJsonResponse } from "@/lib/api/stub";

export function GET() {
  return stubJsonResponse("/api/v1/ratings");
}
