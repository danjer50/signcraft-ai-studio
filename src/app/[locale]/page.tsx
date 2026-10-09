import { FoundationOverview } from "@/components/home/foundation-overview";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const locale = await localeFromRouteParams(params);

  return <FoundationOverview messages={getMessages(locale)} />;
}
