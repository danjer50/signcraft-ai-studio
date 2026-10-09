/**
 * English messages. This file is the reference shape: `fr.ts` and `ar.ts` are typed
 * against `Messages`, so the compiler rejects any missing or extra key.
 */
export const en = {
  app: {
    name: "SignCraft AI Studio",
    tagline: "Professional sign design studio",
    description:
      "Design, visualise and prepare professional signs. This is the foundation build: navigation, layout, design system and languages.",
    buildLabel: "Foundation build",
  },
  common: {
    skipToContent: "Skip to content",
    menu: "Menu",
    language: "Language",
    primaryNavigation: "Primary navigation",
  },
  nav: {
    home: "Home",
    projects: "Projects",
    design2d: "2D design",
    geometry3d: "3D geometry",
    mockups: "AI mockups",
    exports: "Exports",
  },
  status: {
    planned: "Planned",
  },
  home: {
    title: "Studio foundation",
    intro:
      "This build sets up the application shell, the design system and the three interface languages. The design tools themselves are not implemented yet.",
    statusTitle: "What works today",
    statusBody:
      "Navigation, the responsive layout, switching between French, English and Arabic, and this status page. Nothing else is implemented yet.",
    modulesTitle: "Planned modules",
  },
  modules: {
    design2d: {
      title: "2D editor",
      description:
        "Editable sign layouts with shapes, text, images and layers, measured in real millimetres.",
    },
    geometry3d: {
      title: "3D geometry",
      description:
        "Real 3D models of letters, panels and mounts built from the design, with true dimensions.",
    },
    mockups: {
      title: "AI mockups",
      description:
        "Mock-ups of a sign on a site photo. They are illustrative only and do not guarantee real dimensions.",
    },
    persistence: {
      title: "Projects and saving",
      description: "Save, reopen and version projects on this device first.",
    },
    exports: {
      title: "Exports",
      description:
        "Drawings and 3D files that state exactly what they contain and how accurate they are.",
    },
  },
};

export type Messages = typeof en;
