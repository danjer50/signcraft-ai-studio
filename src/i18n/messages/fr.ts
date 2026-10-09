import type { Messages } from "./en";

export const fr: Messages = {
  app: {
    name: "SignCraft AI Studio",
    tagline: "Studio de conception d'enseignes assistée par l'IA",
    description:
      "Concevez des enseignes professionnelles : décrivez votre idée, choisissez une direction visuelle et prévisualisez les styles. La génération par IA et les outils de fabrication sont prévus.",
    buildLabel: "Version de démonstration",
  },
  common: {
    skipToContent: "Aller au contenu",
    menu: "Menu",
    language: "Langue",
    primaryNavigation: "Navigation principale",
  },
  nav: {
    home: "Accueil",
    create: "Créer mon enseigne",
    pro: "Espace professionnel",
    projects: "Projets",
    design2d: "Conception 2D",
    geometry3d: "Géométrie 3D",
    mockups: "Maquettes IA",
    exports: "Exports",
  },
  status: {
    planned: "Prévu",
    inDemo: "Dans cette démo",
  },
  home: {
    title: "VOTRE IDÉE. NOTRE IA. VOTRE ENSEIGNE PARFAITE.",
    lead: "Créez des modèles d'enseignes professionnels sans compétences en design.",
    primaryCta: "Créer mon enseigne",
    secondaryCta: "Explorer des exemples de créations",
  },
  examples: {
    title: "Des styles d'enseignes pour vous inspirer",
    intro:
      "Des lettres lumineuses aux devantures modernes, partez d'un style adapté à votre activité.",
    illustrativeNote: "Illustrations de styles d'enseignes, présentées pour vous inspirer.",
    items: {
      illuminated: {
        title: "Lettres lumineuses",
        text: "Des lettres rétroéclairées, lisibles et élégantes dès la nuit tombée.",
      },
      cafe: {
        title: "Enseignes de cafés et de commerces",
        text: "Des enseignes en saillie chaleureuses qui donnent une vraie présence à un petit commerce.",
      },
      lettering3d: {
        title: "Lettres 3D",
        text: "Des lettres métalliques en relief, aux arêtes nettes et à la profondeur réelle.",
      },
      storefront: {
        title: "Devantures modernes",
        text: "Des enseignes de façade épurées, avec une lumière maîtrisée et un fort contraste.",
      },
    },
  },
  workflow: {
    title: "Comment les clients créent leur enseigne",
    intro:
      "Un parcours simple, de l'idée à l'enseigne. Les étapes 1 à 3 fonctionnent dans la démonstration d'aujourd'hui ; la suite arrive.",
    stepsLabel: "Étapes de création",
    step1: {
      title: "Décrire l'enseigne",
      body: "Indiquez le nom et le type de lieu : café, commerce, cabinet. Une photo de référence sera possible plus tard.",
    },
    step2: {
      title: "Choisir une direction visuelle",
      body: "Choisissez une ambiance : néon, lettres lumineuses, métal 3D ou élégance minimale.",
    },
    step3: {
      title: "Examiner un aperçu",
      body: "Visualisez votre texte dans la direction choisie, modifiez-le en direct et comparez les directions.",
    },
    step4: {
      title: "Demander des modifications ou continuer",
      body: "Demandez des révisions et validez une direction lorsque la génération par IA sera disponible.",
    },
    cta: "Commencer par votre idée",
  },
  create: {
    title: "Créer mon enseigne",
    lead: "Essayez les premières étapes : décrivez votre enseigne, choisissez une direction et examinez un aperçu en direct.",
    demoTitle: "Aperçu de style en direct",
    demoLead:
      "Saisissez le texte de votre enseigne et choisissez une direction visuelle. L'aperçu se met à jour pendant que vous tapez.",
    textLabel: "Texte de l'enseigne",
    textPlaceholder: "p. ex. Studio",
    taglineLabel: "Slogan (facultatif)",
    taglinePlaceholder: "p. ex. Boulangerie · Café · Pâtisserie",
    styleLegend: "Direction visuelle",
    styles: {
      neon: {
        label: "Éclat néon",
        hint: "Des tubes lumineux et un halo doux pour une ambiance nocturne vivante.",
      },
      channel: {
        label: "Lettres lumineuses",
        hint: "Des lettres rétroéclairées classiques, lisibles de loin.",
      },
      dimensional: {
        label: "Lettres métal 3D",
        hint: "Des lettres épaisses en relief avec un fini métal brossé.",
      },
      minimal: {
        label: "Élégance minimale",
        hint: "Des lignes fines et un interlettrage généreux pour un look moderne et discret.",
      },
    },
    previewLabel: "Aperçu de l'enseigne",
    previewCaption: "Aperçu en direct de votre texte dans la direction choisie.",
    previewFallback: "Votre enseigne",
    limitationsTitle: "Ce qu'est cet aperçu",
    limitationsBody:
      "L'aperçu met en forme votre texte localement dans votre navigateur. Il ne s'agit ni d'une création générée par IA, ni d'un modèle de fabrication : couleurs, dimensions et construction ne sont pas techniquement exacts.",
    referenceNote:
      "Les photos de référence et la génération par IA sont prévues. Cet aperçu n'analyse aucune image et ne produit aucune donnée de fabrication.",
  },
  pro: {
    title: "Espace professionnel",
    lead: "Un espace dédié aux enseignistes et aux fabricants : dimensions exactes, géométrie 3D réelle, matériaux, implantation LED et exports de fabrication.",
    audience:
      "Ce point d'entrée s'adresse aux enseignistes et aux fabricants. Les outils ci-dessous sont prévus et ne sont pas encore disponibles — rien sur cette page n'est un éditeur.",
    audienceTitle: "À qui s'adresse cet espace",
    toolsTitle: "Outils prévus",
    entryNote:
      "Chaque outil sera livré avec des tests et une documentation claire. D'ici là, cette page ne fait que décrire le projet.",
    openCta: "Découvrir l'espace professionnel",
    cta: "Essayer le parcours client",
  },
  modules: {
    design2d: {
      title: "Éditeur 2D",
      description:
        "Mises en page d'enseignes modifiables, avec formes, textes, images et calques, mesurées en millimètres réels.",
    },
    geometry3d: {
      title: "Géométrie 3D",
      description:
        "Modèles 3D réels des lettres, panneaux et fixations, construits à partir de la conception avec des dimensions exactes.",
    },
    mockups: {
      title: "Maquettes IA",
      description:
        "Mises en situation d'une enseigne sur une photo de site. Elles sont indicatives et ne garantissent pas les dimensions réelles.",
    },
    persistence: {
      title: "Projets et sauvegarde",
      description: "Enregistrer, rouvrir et versionner les projets, d'abord sur cet appareil.",
    },
    exports: {
      title: "Exports",
      description:
        "Plans et fichiers 3D qui indiquent précisément leur contenu et leur niveau de précision.",
    },
  },
  notFound: {
    title: "Page introuvable",
    heading: "Cette page n'existe pas",
    body: "L'adresse contient peut-être une faute de frappe, ou la page a été déplacée. Utilisez le menu ou revenez à la page d'accueil.",
    homeLink: "Retour à la page d'accueil",
  },
};
