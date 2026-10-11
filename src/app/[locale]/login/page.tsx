import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.auth.login.title} · ${messages.app.name}`,
    description: messages.auth.login.lead,
  };
}

/** The one shared login page for Admin and Professional accounts (Milestone 5). */
export default async function LoginPage({ params }: LoginPageProps) {
  const locale = await localeFromRouteParams(params);

  return <LoginForm locale={locale} messages={getMessages(locale)} />;
}
