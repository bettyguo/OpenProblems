import { StubPage } from "@/components/ui/stub-page";

interface RatingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RatingsPage({ params }: RatingsPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`${slug} — rating actions`}
      description="Full rating-action history for this problem. Phase 3."
    />
  );
}
