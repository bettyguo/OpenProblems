import { stubJsonResponse } from "@/lib/api/stub";

interface ProblemRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: ProblemRouteContext) {
  const { slug } = await context.params;
  return stubJsonResponse(`/api/v1/problems/${slug}`);
}
