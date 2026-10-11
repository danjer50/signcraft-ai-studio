import type { Metadata } from "next";

import { StudioPanel } from "@/components/auth/studio-panel";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type StudioPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.auth.studio.title} · ${messages.app.name}`,
    description: messages.auth.studio.lead,
  };
}

/**
 * The Professional Studio (Milestone 5): the signed-in workspace for Professionals
 * (and the Admin, who always retains access). Editing tools are a later milestone.
 */
export default async function StudioPage({ params }: StudioPageProps) {
  const locale = await localeFromRouteParams(params);

  return <StudioPanel locale={locale} messages={getMessages(locale)} />;
}
