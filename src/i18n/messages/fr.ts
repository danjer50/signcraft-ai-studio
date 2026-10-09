import type { Messages } from "./en";

export const fr: Messages = {
  app: {
    name: "SignCraft AI Studio",
    tagline: "Studio professionnel de conception d'enseignes",
    description:
      "Concevez, visualisez et préparez des enseignes professionnelles. Cette version de base comprend la navigation, la mise en page, le système graphique et les langues.",
    buildLabel: "Version de base",
  },
  common: {
    skipToContent: "Aller au contenu",
    menu: "Menu",
    language: "Langue",
    primaryNavigation: "Navigation principale",
  },
  nav: {
    home: "Accueil",
    projects: "Projets",
    design2d: "Conception 2D",
    geometry3d: "Géométrie 3D",
    mockups: "Maquettes IA",
    exports: "Exports",
  },
  status: {
    planned: "Prévu",
  },
  home: {
    title: "Socle du studio",
    intro:
      "Cette version met en place la structure de l'application, le système graphique et les trois langues d'interface. Les outils de conception ne sont pas encore développés.",
    statusTitle: "Ce qui fonctionne aujourd'hui",
    statusBody:
      "La navigation, la mise en page adaptative, le passage entre français, anglais et arabe, et cette page d'état. Rien d'autre n'est encore développé.",
    modulesTitle: "Modules prévus",
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
