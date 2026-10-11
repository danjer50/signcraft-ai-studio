import { HomeView } from "@/components/home/home-view";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const locale = await localeFromRouteParams(params);

  return <HomeView locale={locale} messages={getMessages(locale)} />;
}
