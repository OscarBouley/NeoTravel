import ReponseDevis from "@/components/reponse-devis";

export default async function DeclinerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReponseDevis devisId={id} action="decliner" />;
}
