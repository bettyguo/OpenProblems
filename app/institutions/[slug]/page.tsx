import { StubPage } from "@/components/ui/stub-page";

interface InstitutionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InstitutionPage({ params }: InstitutionPageProps) {
  const { slug } = await params;
  return (
    <StubPage
      title={`Institution: ${slug}`}
      description="Institution profile with ranked subdomain coverage. Phase 2."
    />
  );
}
