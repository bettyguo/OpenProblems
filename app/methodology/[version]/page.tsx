import { StubPage } from "@/components/ui/stub-page";

interface MethodologyVersionPageProps {
  params: Promise<{ version: string }>;
}

export default async function MethodologyVersionPage({ params }: MethodologyVersionPageProps) {
  const { version } = await params;
  return (
    <StubPage
      title={`Methodology ${version}`}
      description="Versioned methodology snapshot. Phase 1+ — frozen at each major bump."
    />
  );
}
