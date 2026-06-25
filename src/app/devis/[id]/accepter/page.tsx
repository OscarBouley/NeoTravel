import ReponseDevis from "@/components/reponse-devis";

export default async function AccepterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReponseDevis devisId={id} action="accepter" />;
}
