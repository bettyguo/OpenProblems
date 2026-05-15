import { StubPage } from "@/components/ui/stub-page";

interface HistoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`${slug} — history`}
      description="Timeline ribbon and saturation curve. Phase 3."
    />
  );
}
