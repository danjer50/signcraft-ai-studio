import { parseDraft, serializeDraft, type CustomerDraft } from "@/templates/draft";

/**
 * Local persistence for the customer draft (Normal Mode). The draft — selected
 * template, business name, tagline, colours, lettering style, photo metadata and
 * selection — survives navigation and reloads on the same device. This is genuine
 * device-local persistence: there is no cross-device synchronisation, and nothing
 * leaves the browser.
 */

const STORAGE_KEY = "signcraft-ai-studio:draft";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Some browsers throw on access (private mode): persistence is best-effort.
    return null;
  }
}

/** Loads the saved draft, or null when none exists or it fails to parse. */
export function loadDraft(): CustomerDraft | null {
  const store = storage();
  if (!store) {
    return null;
  }
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    return parseDraft(raw);
  } catch {
    return null;
  }
}

/** Saves the draft. Returns false when persistence is unavailable. */
export function saveDraft(draft: CustomerDraft): boolean {
  const store = storage();
  if (!store) {
    return false;
  }
  try {
    store.setItem(STORAGE_KEY, serializeDraft(draft));
    return true;
  } catch {
    return false;
  }
}

/** Removes the saved draft. */
export function clearDraft(): void {
  const store = storage();
  if (!store) {
    return;
  }
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort: a failed removal changes nothing visible.
  }
}
