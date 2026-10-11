import type { Metadata } from "next";

import { AdminDashboard } from "@/components/auth/admin-dashboard";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.auth.admin.title} · ${messages.app.name}`,
    description: messages.auth.admin.lead,
  };
}

/**
 * The Admin Space (Milestone 5). The account management API enforces the admin role
 * server-side; the dashboard redirects anonymous visitors and Professionals to the
 * login page.
 */
export default async function AdminPage({ params }: AdminPageProps) {
  const locale = await localeFromRouteParams(params);

  return <AdminDashboard locale={locale} messages={getMessages(locale)} />;
}
