import {
  defaultProject,
  parseProject,
  serializeProject,
  type SignProject,
} from "./sign-project";

/**
 * Device-local persistence for the professional project (the design draft plus
 * the fabrication properties). Same model as the Normal Mode draft store: the
 * project survives navigation and reloads on this device. No cross-device
 * synchronisation is claimed.
 */

const STORAGE_KEY = "signcraft-ai-studio:project";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Loads the saved project, or a fresh default project when none is stored. */
export function loadProject(): SignProject {
  const store = storage();
  if (!store) {
    return defaultProject();
  }
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) {
      return defaultProject();
    }
    return parseProject(raw) ?? defaultProject();
  } catch {
    return defaultProject();
  }
}

/** Saves the project. Returns false when persistence is unavailable. */
export function saveProject(project: SignProject): boolean {
  const store = storage();
  if (!store) {
    return false;
  }
  try {
    store.setItem(STORAGE_KEY, serializeProject(project));
    return true;
  } catch {
    return false;
  }
}
