import { Locale } from "@/i18n-config";
import PropertiesPageContent from "./properties-page-content";

export default async function PropertiesPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return <PropertiesPageContent lang={lang} />;
}
