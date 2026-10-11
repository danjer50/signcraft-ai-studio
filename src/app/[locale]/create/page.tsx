import type { Metadata } from "next";

import { CreateView } from "@/components/workflow/create-view";
import { getMessages } from "@/i18n/get-messages";
import { localeFromRouteParams } from "@/i18n/route-locale";

type CreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CreatePageProps): Promise<Metadata> {
  const messages = getMessages(await localeFromRouteParams(params));
  return {
    title: `${messages.create.title} · ${messages.app.name}`,
    description: messages.create.lead,
  };
}

export default async function CreatePage({ params }: CreatePageProps) {
  const locale = await localeFromRouteParams(params);

  return <CreateView messages={getMessages(locale)} />;
}
