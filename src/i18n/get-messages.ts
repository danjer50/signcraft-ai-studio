import type { Locale } from "./config";
import { ar } from "./messages/ar";
import { en } from "./messages/en";
import { fr } from "./messages/fr";
import type { Messages } from "./messages/en";

const messagesByLocale: Record<Locale, Messages> = { fr, en, ar };

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale];
}
