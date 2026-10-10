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
      body: "Indiquez le nom et le type de lieu, téléversez une photo de votre devanture et indiquez où l'enseigne doit apparaître.",
    },
    step2: {
      title: "Choisir une direction visuelle",
      body: "Choisissez parmi dix modèles — éclat néon, lettres lumineuses, métal 3D, élégance minimale et plus — et ajustez les couleurs.",
    },
    step3: {
      title: "Examiner un aperçu",
      body: "Visualisez votre texte dans le modèle choisi, modifiez-le en direct et changez de modèle pour comparer.",
    },
    step4: {
      title: "Demander des modifications ou continuer",
      body: "Demandez des révisions et validez une direction lorsque la génération par IA sera disponible.",
    },
    cta: "Commencer par votre idée",
  },
  create: {
    title: "Créer mon enseigne",
    lead: "Essayez les premières étapes : décrivez votre enseigne, téléversez une photo de votre devanture, choisissez un modèle et examinez un aperçu en direct.",
    demoTitle: "Aperçu de style en direct",
    demoLead:
      "Saisissez le nom de votre commerce, choisissez un modèle et ajustez les couleurs — l'aperçu se met à jour instantanément. Téléversez une photo de votre devanture, indiquez la zone de l'enseigne et générez une maquette visuelle simple de votre enseigne.",
    textLabel: "Nom du commerce",
    textPlaceholder: "p. ex. Studio",
    taglineLabel: "Slogan (facultatif)",
    taglinePlaceholder: "p. ex. Boulangerie · Café · Pâtisserie",
    colourLegend: "Couleurs",
    photo: {
      title: "La photo de votre devanture",
      lead: "Téléversez une photo de votre devanture et indiquez où l'enseigne doit apparaître. La photo reste dans votre navigateur — elle n'est jamais envoyée.",
      photoAlt: "Photo de votre devanture",
      uploadCta: "Téléverser une photo",
      changeCta: "Changer de photo",
      removeCta: "Retirer la photo",
      currentLabel: "Photo actuelle",
      errors: {
        type: "Ce fichier n'est pas une photo prise en charge. Choisissez une image JPEG, PNG ou WebP.",
        size: "Cette photo est trop lourde. La taille maximale est de 12 Mo.",
        dimensions:
          "Cette photo est trop grande pour être traitée. Le maximum est de 4096 × 4096 pixels.",
        unreadable: "Cette photo n'a pas pu être lue. Essayez une autre image.",
      },
    },
    selection: {
      title: "Zone de l'enseigne",
      hint: "Glissez sur la photo pour indiquer où l'enseigne doit apparaître.",
      adjustHint:
        "Glissez les poignées pour redimensionner, glissez à l'intérieur de la zone pour la déplacer.",
      emptyHint:
        "Aucune zone marquée pour le moment. Glissez sur la photo ou marquez une zone par défaut.",
      defaultCta: "Marquer une zone par défaut",
      clearCta: "Effacer la sélection",
      redrawCta: "Retracer la sélection",
      schematicNote:
        "La zone marquée est un positionnement schématique — ni une maquette réaliste, ni un plan de fabrication.",
      groupLabel: "Zone de positionnement de l'enseigne",
      groupLabelWithSize:
        "Zone de positionnement de l'enseigne, {width} × {height} pour cent de la photo",
      keyboardHint:
        "Les flèches déplacent la sélection, Maj et une flèche la redimensionnent, Suppr l'efface. Entrée marque une zone par défaut.",
    },
    mockup: {
      title: "Maquette visuelle",
      lead: "Générez une maquette visuelle simple : votre enseigne placée à plat dans la zone marquée, calculée dans votre navigateur.",
      generateCta: "Générer l'aperçu de la maquette",
      regenerateCta: "Mettre à jour la maquette",
      downloadCta: "Télécharger le PNG",
      rendering: "Génération de la maquette…",
      mockupAlt: "Maquette visuelle simple de votre enseigne sur la photo de votre devanture",
      honestyNote:
        "Une maquette visuelle simple : l'enseigne est placée à plat dans la zone marquée, sans correction de perspective, sans éclairage ambiant et sans ombres portées. Ce n'est pas un rendu réaliste et ce n'est pas un document de fabrication.",
      disabledNoPhoto: "Téléversez d'abord une photo de votre devanture.",
      disabledNoSelection: "Marquez d'abord la zone de l'enseigne sur la photo.",
      error: "La maquette n'a pas pu être générée. Veuillez réessayer.",
      unsupported: "La génération de maquette n'est pas prise en charge par ce navigateur.",
    },
    previewLabel: "Aperçu de l'enseigne",
    previewCaption: "Aperçu en direct de votre texte dans le modèle choisi.",
    previewFallback: "Votre enseigne",
    limitationsTitle: "Ce qu'est cet aperçu",
    limitationsBody:
      "L'aperçu met en forme votre texte localement dans votre navigateur. Il ne s'agit ni d'une création générée par IA, ni d'un modèle de fabrication : couleurs, dimensions et construction ne sont pas techniquement exacts.",
    referenceNote:
      "Votre photo et la zone marquée restent dans votre navigateur et ne sont jamais envoyées. La génération par IA est prévue. L'aperçu de style n'analyse aucune image ; la maquette visuelle place votre enseigne à plat dans la zone marquée — sans perspective, éclairage ni ombres — et ne produit aucune donnée de fabrication.",
  },
  templates: {
    pickerLegend: "Modèle",
    pickerHint: "Choisissez un modèle — l'aperçu se met à jour instantanément.",
    items: {
      neonScript: {
        name: "Éclat néon",
        hint: "Des lettres lumineuses avec un halo doux pour une ambiance nocturne vivante.",
      },
      channelLetters: {
        name: "Lettres lumineuses",
        hint: "Des lettres rétroéclairées classiques, lisibles de loin.",
      },
      dimensionalMetal: {
        name: "Lettres métal 3D",
        hint: "Des lettres épaisses en relief avec un fini métal brossé.",
      },
      minimalLetters: {
        name: "Élégance minimale",
        hint: "Des lignes fines et un interlettrage généreux pour un look moderne et discret.",
      },
      projectingBlade: {
        name: "Enseigne en saillie",
        hint: "Un panneau qui se détache de la façade et se lit le long de la rue.",
      },
      awningBand: {
        name: "Store d'enseigne",
        hint: "Une large bande au-dessus de l'entrée avec des lettres lisibles et affirmées.",
      },
      windowVinyl: {
        name: "Adhésif vitrine",
        hint: "Des lettres nettes appliquées directement sur la vitre.",
      },
      lightboxPlaque: {
        name: "Caisson lumineux",
        hint: "Un panneau éclairé en douceur, lumineux de jour comme de nuit.",
      },
      marqueeBulbs: {
        name: "Enseigne à ampoules",
        hint: "Des lettres affirmées encadrées par une bordure de petites lumières.",
      },
      totemPanel: {
        name: "Totem au sol",
        hint: "Un haut panneau autoportant, lisible de loin.",
      },
    },
  },
  colours: {
    slots: {
      face: "Couleur des lettres",
      glow: "Couleur de la lumière",
      accent: "Couleur d'accent",
    },
    names: {
      cyan: "Cyan",
      azure: "Azur",
      teal: "Sarcelle",
      emerald: "Émeraude",
      amber: "Ambre",
      gold: "Or",
      coral: "Corail",
      rose: "Rose",
      violet: "Violet",
      ice: "Glace",
      warmWhite: "Blanc chaud",
      graphite: "Graphite",
      silver: "Argent",
      copper: "Cuivre",
    },
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
  auth: {
    nav: {
      signIn: "Connexion",
      signOut: "Se déconnecter",
      adminSpace: "Espace admin",
      proStudio: "Studio pro",
    },
    roles: {
      admin: "Administrateur",
      pro: "Professionnel",
    },
    login: {
      title: "Connexion",
      lead: "Une seule connexion partagée pour l'Espace admin et le Studio professionnel.",
      email: "Adresse e-mail",
      password: "Mot de passe",
      submit: "Se connecter",
      submitting: "Connexion…",
      passwordTooShort: "Votre mot de passe doit contenir au moins 12 caractères.",
      error: "La connexion a échoué. Vérifiez vos identifiants et réessayez.",
    },
    setup: {
      title: "Configuration initiale de l'administrateur",
      lead: "Configuration unique du premier compte administrateur. Cette page n'est liée nulle part, et elle cesse de fonctionner dès qu'un administrateur existe.",
      secret: "Secret de configuration",
      email: "Adresse e-mail de l'administrateur",
      password: "Mot de passe (12 caractères minimum)",
      confirm: "Confirmer le mot de passe",
      submit: "Créer le compte administrateur",
      submitting: "Création du compte…",
      mismatch: "Les mots de passe ne correspondent pas.",
      success: "Le compte administrateur est prêt.",
      successLead:
        "Vous pouvez maintenant vous connecter avec l'adresse e-mail et le mot de passe que vous venez de définir.",
      goToLogin: "Aller à la connexion",
    },
    setPassword: {
      title: "Définissez votre mot de passe",
      lead: "Choisissez un mot de passe pour votre compte professionnel. Ce lien fonctionne une seule fois et expire après une heure.",
      password: "Nouveau mot de passe (12 caractères minimum)",
      confirm: "Confirmer le nouveau mot de passe",
      submit: "Définir le mot de passe et se connecter",
      submitting: "Définition du mot de passe…",
      mismatch: "Les mots de passe ne correspondent pas.",
      invalidToken:
        "Ce lien d'invitation est invalide ou a expiré. Demandez-en un nouveau à l'administrateur.",
    },
    admin: {
      title: "Espace admin",
      lead: "Gérez les comptes professionnels : invitez, suspendez, restaurez et révoquez.",
      signedInAs: "Connecté en tant que",
      accounts: "Comptes",
      email: "Adresse e-mail",
      role: "Rôle",
      status: "Statut",
      created: "Créé le",
      lastLogin: "Dernière connexion",
      never: "Jamais",
      inviteTitle: "Inviter un professionnel",
      inviteLead:
        "Le compte est créé sans mot de passe. Copiez le lien d'invitation et envoyez-le au professionnel — il fonctionne une seule fois et expire après une heure.",
      inviteEmail: "Adresse e-mail du professionnel",
      inviteSubmit: "Créer l'invitation",
      inviteSubmitting: "Création…",
      inviteCreated: "Invitation créée. Partagez ce lien :",
      copyLink: "Copier le lien",
      copied: "Copié",
      suspend: "Suspendre",
      confirmSuspend: "Suspendre ?",
      restore: "Restaurer",
      revoke: "Révoquer",
      confirmRevoke: "Révoquer ?",
      statuses: {
        invited: "Invité",
        active: "Actif",
        suspended: "Suspendu",
        revoked: "Révoqué",
      },
      loading: "Chargement…",
      loadError: "Les comptes n'ont pas pu être chargés. Veuillez vous reconnecter.",
      empty: "Aucun compte professionnel pour le moment.",
    },
    studio: {
      title: "Studio professionnel",
      lead: "Votre espace de travail professionnel.",
      signedInAs: "Connecté en tant que",
      role: "Rôle",
      signOut: "Se déconnecter",
      plannedTitle: "Les outils d'édition arrivent",
      plannedBody:
        "Le Studio professionnel accueillera les outils d'édition manuelle : dimensions, design 2D, géométrie 3D, matériaux et éclairage. Ils sont prévus, pas encore construits.",
      createCta: "Ouvrir le studio client gratuit",
    },
  },
};
