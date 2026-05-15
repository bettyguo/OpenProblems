import { StubPage } from "@/components/ui/stub-page";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`Author: ${slug}`}
      description="Author profile with affiliations and cumulative problem-impact score. Phase 2."
    />
  );
}
