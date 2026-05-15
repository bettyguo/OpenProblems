import { StubPage } from "@/components/ui/stub-page";

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`Problem: ${slug}`}
      description="The canonical 10-block problem detail layout from MASTER_PROMPT §9. Phase 1 content pending."
    />
  );
}
