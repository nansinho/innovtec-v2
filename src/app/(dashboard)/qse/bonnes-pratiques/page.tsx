import { getBonnesPratiques } from "@/actions/bonnes-pratiques";
import BonnesPratiquesPageClient from "./page-client";


export default async function BonnesPratiquesPage() {
  const items = await getBonnesPratiques();

  return <BonnesPratiquesPageClient items={items} />;
}
