import type { Metadata } from "next";

import { ProGate } from "@/components/pro/pro-gate";
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

/**
 * The Pro workspace entry (Stage D): the route exists but is not public — the
 * gate redirects anonymous visitors to Connection/Login, where the access-code
 * entry is. The workspace is never linked from the landing page or the menus.
 */
export default async function ProPage({ params }: ProPageProps) {
  const locale = await localeFromRouteParams(params);

  return <ProGate locale={locale} messages={getMessages(locale)} />;
}
