/**
 * English messages. This file is the reference shape: `fr.ts` and `ar.ts` are typed
 * against `Messages`, so the compiler rejects any missing or extra key.
 */
export const en = {
  app: {
    name: "SignCraft AI Studio",
    tagline: "AI-assisted sign design studio",
    description:
      "Design professional signs: describe your idea, choose a visual direction and preview styles. AI design generation and fabrication tools are planned.",
    buildLabel: "Preview build",
  },
  common: {
    skipToContent: "Skip to content",
    menu: "Menu",
    language: "Language",
    primaryNavigation: "Primary navigation",
  },
  nav: {
    home: "Home",
    create: "Create my sign",
    pro: "Pro workspace",
    projects: "Projects",
    design2d: "2D design",
    geometry3d: "3D geometry",
    mockups: "AI mockups",
    exports: "Exports",
  },
  status: {
    planned: "Planned",
    inDemo: "In this demo",
  },
  home: {
    title: "YOUR IDEA. OUR AI. YOUR PERFECT SIGN.",
    lead: "Create professional sign designs without needing design skills.",
    primaryCta: "Create My Sign",
    secondaryCta: "Explore example designs",
  },
  examples: {
    title: "Sign styles to inspire you",
    intro:
      "From illuminated letters to modern storefronts, start from a style that fits your business.",
    illustrativeNote: "Illustrations of sign styles, shown for inspiration.",
    items: {
      illuminated: {
        title: "Illuminated letters",
        text: "Halo-lit letters that stay readable and elegant after dark.",
      },
      cafe: {
        title: "Café and shop signs",
        text: "Warm projecting signs that give a small place a big presence.",
      },
      lettering3d: {
        title: "3D lettering",
        text: "Dimensional metal letterforms with crisp edges and real depth.",
      },
      storefront: {
        title: "Modern storefronts",
        text: "Clean fascia signage with restrained light and strong contrast.",
      },
    },
  },
  workflow: {
    title: "How customers create their sign",
    intro:
      "A simple path from idea to sign. Steps 1 to 3 work in today's preview demo; the rest is on the way.",
    stepsLabel: "Creation steps",
    step1: {
      title: "Describe the sign",
      body: "Tell us the name and the kind of place: a café, a shop, a practice. A reference photo will be possible later.",
    },
    step2: {
      title: "Choose a visual direction",
      body: "Pick a mood: neon glow, illuminated letters, 3D metal or minimal elegance.",
    },
    step3: {
      title: "Review a design preview",
      body: "See your text in the chosen direction, adjust it live, and compare directions side by side.",
    },
    step4: {
      title: "Request changes or continue",
      body: "Ask for revisions and approve a direction when AI design generation is available.",
    },
    cta: "Start with your idea",
  },
  create: {
    title: "Create my sign",
    lead: "Try the first steps now: describe your sign, choose a direction and review a live preview.",
    demoTitle: "Live style preview",
    demoLead: "Type your sign text and pick a visual direction. The preview updates as you type.",
    textLabel: "Sign text",
    textPlaceholder: "e.g. Studio",
    taglineLabel: "Tagline (optional)",
    taglinePlaceholder: "e.g. Bakery · Coffee · Pastry",
    styleLegend: "Visual direction",
    styles: {
      neon: {
        label: "Neon glow",
        hint: "Bright tubes and a soft halo for a lively night-time look.",
      },
      channel: {
        label: "Illuminated letters",
        hint: "Classic halo-lit letters, readable from far away.",
      },
      dimensional: {
        label: "3D metal lettering",
        hint: "Solid dimensional letters with a brushed-metal feel.",
      },
      minimal: {
        label: "Minimal elegance",
        hint: "Fine lines and generous spacing for a quiet, modern look.",
      },
    },
    previewLabel: "Sign preview",
    previewCaption: "Live preview of your text in the selected direction.",
    previewFallback: "Your sign",
    limitationsTitle: "What this preview is",
    limitationsBody:
      "The preview styles your text locally in your browser. It is not an AI-generated design and not a fabrication model: colours, dimensions and construction are not technically accurate.",
    referenceNote:
      "Reference photos and AI design generation are planned. This preview does not analyse images and produces no fabrication data.",
  },
  pro: {
    title: "Professional workspace",
    lead: "A dedicated workspace for sign makers and fabricators: exact dimensions, real 3D geometry, materials, LED layout and fabrication exports.",
    audience:
      "This entry point is for professional sign makers and fabricators. The tools below are planned and not available yet — nothing on this page is an editor.",
    audienceTitle: "Who this is for",
    toolsTitle: "Planned tools",
    entryNote:
      "Each tool will ship with tests and clear documentation. Until then, this page only describes the plan.",
    openCta: "Explore the professional workspace",
    cta: "Try the customer flow",
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
  notFound: {
    title: "Page not found",
    heading: "This page does not exist",
    body: "The address may contain a typing mistake, or the page may have moved. Use the menu or go back to the home page.",
    homeLink: "Back to the home page",
  },
};

export type Messages = typeof en;
