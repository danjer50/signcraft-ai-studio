import type { Metadata } from "next";

import { SetupForm } from "@/components/auth/setup-form";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type SetupPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SetupPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.auth.setup.title} · ${messages.app.name}`,
    description: messages.auth.setup.lead,
    robots: { index: false, follow: false },
  };
}

/**
 * The one-time, unlinked initial admin setup (Milestone 5). It is deliberately not
 * linked from the navigation, it is noindex, and the API refuses to run once an
 * admin account exists.
 */
export default async function SetupPage({ params }: SetupPageProps) {
  const locale = await localeFromRouteParams(params);

  return <SetupForm locale={locale} messages={getMessages(locale)} />;
}
