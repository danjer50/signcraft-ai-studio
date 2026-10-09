import { notFound } from "next/navigation";

import { FoundationOverview } from "@/components/home/foundation-overview";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <FoundationOverview messages={getMessages(locale)} />;
}
