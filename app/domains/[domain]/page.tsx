import { StubPage } from "@/components/ui/stub-page";

interface DomainPageProps {
  params: Promise<{ domain: string }>;
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { domain } = await params;
  return (
    <StubPage
      title={`Domain: ${domain}`}
      description="Subdomain list and featured problems. Phase 1 content pending."
    />
  );
}
