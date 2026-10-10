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
      body: "Tell us the name and the kind of place, upload a photo of your storefront, and mark where the sign should appear.",
    },
    step2: {
      title: "Choose a visual direction",
      body: "Choose from ten templates — neon glow, illuminated letters, 3D metal, minimal and more — and fine-tune the colours.",
    },
    step3: {
      title: "Review a design preview",
      body: "See your text in the chosen template, adjust it live, and switch templates to compare them.",
    },
    step4: {
      title: "Request changes or continue",
      body: "Ask for revisions and approve a direction when AI design generation is available.",
    },
    cta: "Start with your idea",
  },
  create: {
    title: "Create my sign",
    lead: "Try the first steps now: describe your sign, upload a storefront photo, choose a template and review a live preview.",
    demoTitle: "Live style preview",
    demoLead:
      "Type your business name, pick a template and adjust the colours — the preview updates instantly. Upload a photo of your storefront, mark the sign area and generate a basic visual mockup of your sign on it.",
    textLabel: "Business name",
    textPlaceholder: "e.g. Studio",
    taglineLabel: "Tagline (optional)",
    taglinePlaceholder: "e.g. Bakery · Coffee · Pastry",
    colourLegend: "Colours",
    photo: {
      title: "Your storefront photo",
      lead: "Upload a photo of your storefront and mark where the sign should appear. The photo stays in your browser — it is never uploaded.",
      photoAlt: "Photo of your storefront",
      uploadCta: "Upload a photo",
      changeCta: "Change photo",
      removeCta: "Remove photo",
      currentLabel: "Current photo",
      errors: {
        type: "This file is not a supported photo. Please choose a JPEG, PNG or WebP image.",
        size: "This photo is too large. The maximum size is 12 MB.",
        dimensions: "This photo is too large to process. The maximum is 4096 × 4096 pixels.",
        unreadable: "This photo could not be read. Please try another image.",
      },
    },
    selection: {
      title: "Sign area",
      hint: "Drag on the photo to mark where the sign should appear.",
      adjustHint: "Drag the handles to resize, drag inside the area to move it.",
      emptyHint: "No area marked yet. Drag on the photo, or mark a default area.",
      defaultCta: "Mark a default area",
      clearCta: "Clear selection",
      redrawCta: "Redraw selection",
      schematicNote:
        "The marked area is a schematic placement — not a realistic mockup and not a fabrication drawing.",
      groupLabel: "Sign placement area",
      groupLabelWithSize: "Sign placement area, {width} by {height} percent of the photo",
      keyboardHint:
        "Arrow keys move the selection, Shift and an arrow key resize it, Delete clears it. Press Enter to mark a default area.",
    },
    mockup: {
      title: "Visual mockup",
      lead: "Generate a basic visual mockup: your sign placed flat in the marked area, rendered in your browser.",
      generateCta: "Generate mockup preview",
      regenerateCta: "Update the mockup",
      downloadCta: "Download PNG",
      rendering: "Rendering the mockup…",
      mockupAlt: "Basic visual mockup of your sign on your storefront photo",
      honestyNote:
        "A basic visual mockup: the sign is placed flat in the marked area, without perspective correction, environmental lighting or cast shadows. It is not a realistic rendering and not fabrication-ready.",
      disabledNoPhoto: "Upload a photo of your storefront first.",
      disabledNoSelection: "Mark the sign area on the photo first.",
      error: "The mockup could not be generated. Please try again.",
      unsupported: "Mockup generation is not supported by this browser.",
    },
    previewLabel: "Sign preview",
    previewCaption: "Live preview of your text in the selected template.",
    previewFallback: "Your sign",
    limitationsTitle: "What this preview is",
    limitationsBody:
      "The preview styles your text locally in your browser. It is not an AI-generated design and not a fabrication model: colours, dimensions and construction are not technically accurate.",
    referenceNote:
      "Your photo and the marked area stay in your browser and are never uploaded. AI design generation is planned. The style preview does not analyse images; the visual mockup places your sign flat in the marked area — no perspective, lighting or shadows — and produces no fabrication data.",
  },
  templates: {
    pickerLegend: "Template",
    pickerHint: "Pick a template — the preview updates instantly.",
    items: {
      neonScript: {
        name: "Neon glow",
        hint: "Bright glowing letters with a soft halo for a lively night-time look.",
      },
      channelLetters: {
        name: "Illuminated letters",
        hint: "Classic halo-lit letters, readable from far away.",
      },
      dimensionalMetal: {
        name: "3D metal lettering",
        hint: "Solid dimensional letters with a brushed-metal feel.",
      },
      minimalLetters: {
        name: "Minimal elegance",
        hint: "Fine lines and generous spacing for a quiet, modern look.",
      },
      projectingBlade: {
        name: "Projecting blade sign",
        hint: "A panel that stands out from the facade and reads along the street.",
      },
      awningBand: {
        name: "Awning band",
        hint: "A wide band above the entrance with bold, readable lettering.",
      },
      windowVinyl: {
        name: "Window vinyl",
        hint: "Crisp lettering applied directly on the glass.",
      },
      lightboxPlaque: {
        name: "Lightbox plaque",
        hint: "A softly lit panel that glows evenly day and night.",
      },
      marqueeBulbs: {
        name: "Marquee bulbs",
        hint: "Bold letters framed by a border of little lights.",
      },
      totemPanel: {
        name: "Floor totem",
        hint: "A tall freestanding panel that reads from far away.",
      },
    },
  },
  colours: {
    slots: {
      face: "Letter colour",
      glow: "Light colour",
      accent: "Accent colour",
    },
    names: {
      cyan: "Cyan",
      azure: "Azure",
      teal: "Teal",
      emerald: "Emerald",
      amber: "Amber",
      gold: "Gold",
      coral: "Coral",
      rose: "Rose",
      violet: "Violet",
      ice: "Ice",
      warmWhite: "Warm white",
      graphite: "Graphite",
      silver: "Silver",
      copper: "Copper",
    },
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
  auth: {
    nav: {
      signIn: "Sign in",
      signOut: "Sign out",
      adminSpace: "Admin Space",
      proStudio: "Pro Studio",
    },
    roles: {
      admin: "Administrator",
      pro: "Professional",
    },
    login: {
      title: "Sign in",
      lead: "One shared login for the Admin Space and the Professional Studio.",
      email: "Email address",
      password: "Password",
      submit: "Sign in",
      submitting: "Signing in…",
      passwordTooShort: "Your password must be at least 12 characters.",
      error: "Sign-in failed. Please check your details and try again.",
    },
    setup: {
      title: "Initial admin setup",
      lead: "One-time setup of the first administrator account. This page is not linked anywhere, and it stops working as soon as an admin exists.",
      secret: "Setup secret",
      email: "Admin email address",
      password: "Password (12 characters minimum)",
      confirm: "Confirm password",
      submit: "Create the admin account",
      submitting: "Creating the account…",
      mismatch: "The passwords do not match.",
      success: "The admin account is ready.",
      successLead: "You can now sign in with the email address and password you just set.",
      goToLogin: "Go to sign in",
    },
    setPassword: {
      title: "Set your password",
      lead: "Choose a password for your professional account. This link works once and expires after one hour.",
      password: "New password (12 characters minimum)",
      confirm: "Confirm the new password",
      submit: "Set the password and sign in",
      submitting: "Setting the password…",
      mismatch: "The passwords do not match.",
      invalidToken:
        "This invitation link is invalid or has expired. Ask the administrator for a new one.",
    },
    admin: {
      title: "Admin Space",
      lead: "Manage professional accounts: invite, suspend, restore and revoke.",
      signedInAs: "Signed in as",
      accounts: "Accounts",
      email: "Email address",
      role: "Role",
      status: "Status",
      created: "Created",
      lastLogin: "Last sign-in",
      never: "Never",
      inviteTitle: "Invite a professional",
      inviteLead:
        "The account is created without a password. Copy the invitation link and send it to the professional — it works once and expires after one hour.",
      inviteEmail: "Professional's email address",
      inviteSubmit: "Create the invitation",
      inviteSubmitting: "Creating…",
      inviteCreated: "Invitation created. Share this link:",
      copyLink: "Copy the link",
      copied: "Copied",
      suspend: "Suspend",
      confirmSuspend: "Suspend?",
      restore: "Restore",
      revoke: "Revoke",
      confirmRevoke: "Revoke?",
      statuses: {
        invited: "Invited",
        active: "Active",
        suspended: "Suspended",
        revoked: "Revoked",
      },
      loading: "Loading…",
      loadError: "The accounts could not be loaded. Please sign in again.",
      empty: "No professional accounts yet.",
    },
    studio: {
      title: "Professional Studio",
      lead: "Your professional workspace.",
      signedInAs: "Signed in as",
      role: "Role",
      signOut: "Sign out",
      plannedTitle: "Editing tools are on the way",
      plannedBody:
        "The Professional Studio will host the manual editing tools: dimensions, 2D design, 3D geometry, materials and lighting. They are planned, not built yet.",
      createCta: "Open the free customer studio",
    },
  },
};

export type Messages = typeof en;
