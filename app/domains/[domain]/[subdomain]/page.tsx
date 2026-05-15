import { StubPage } from "@/components/ui/stub-page";

interface SubdomainPageProps {
  params: Promise<{ domain: string; subdomain: string }>;
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { domain, subdomain } = await params;
  return (
    <StubPage
      title={`${domain} / ${subdomain}`}
      description="Problems table and filtered viz teaser. Phase 1 content pending."
    />
  );
}
