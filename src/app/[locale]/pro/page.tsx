import type { Metadata } from "next";

import { ProView } from "@/components/pro/pro-view";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type ProPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ProPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.pro.title} · ${messages.app.name}`,
    description: messages.pro.lead,
  };
}

export default async function ProPage({ params }: ProPageProps) {
  const locale = await localeFromRouteParams(params);

  return <ProView locale={locale} messages={getMessages(locale)} />;
}
