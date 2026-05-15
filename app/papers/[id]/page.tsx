import { StubPage } from "@/components/ui/stub-page";

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  return (
    <StubPage
      title={`Paper: ${id}`}
      description="Paper detail with TL;DR, contributions, and cross-links. Phase 2."
    />
  );
}
