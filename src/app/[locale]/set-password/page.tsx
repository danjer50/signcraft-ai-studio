import type { Metadata } from "next";
import { Suspense } from "react";

import { SetPasswordView } from "@/components/auth/set-password-view";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type SetPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SetPasswordPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.auth.setPassword.title} · ${messages.app.name}`,
    description: messages.auth.setPassword.lead,
    robots: { index: false, follow: false },
  };
}

/**
 * The invitation landing page: /:locale/set-password?token=… (Milestone 5). The
 * token is single-use and expires after one hour; the API enforces both.
 */
export default async function SetPasswordPage({ params }: SetPasswordPageProps) {
  const locale = await localeFromRouteParams(params);

  return (
    <Suspense fallback={null}>
      <SetPasswordView locale={locale} messages={getMessages(locale)} />
    </Suspense>
  );
}
