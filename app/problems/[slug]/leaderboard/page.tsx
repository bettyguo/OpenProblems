import { StubPage } from "@/components/ui/stub-page";

interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`${slug} — leaderboard`}
      description="Full leaderboard with sortable, filterable entries. Phase 2."
    />
  );
}
