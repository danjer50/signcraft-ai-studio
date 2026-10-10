/**
 * Error messages for the auth API, in the three site locales. The locale comes from
 * the client's `x-signcraft-locale` header (set by our own fetch wrapper from the page
 * locale), then from Accept-Language, then the site default (French).
 */

type SiteLocale = "fr" | "en" | "ar";

const messages: Record<string, Record<SiteLocale, string>> = {
  bad_request: {
    fr: "La requête est invalide.",
    en: "The request is invalid.",
    ar: "الطلب غير صالح.",
  },
  body_too_large: {
    fr: "La requête est trop volumineuse.",
    en: "The request is too large.",
    ar: "الطلب كبير جدًا.",
  },
  method_not_allowed: {
    fr: "Méthode non autorisée.",
    en: "Method not allowed.",
    ar: "الطريقة غير مسموح بها.",
  },
  invalid_credentials: {
    fr: "Adresse e-mail ou mot de passe incorrect.",
    en: "Incorrect email address or password.",
    ar: "عنوان البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  },
  invalid_setup_secret: {
    fr: "Le secret de configuration est incorrect.",
    en: "The setup secret is incorrect.",
    ar: "رمز الإعداد غير صحيح.",
  },
  admin_already_exists: {
    fr: "Un compte administrateur existe déjà.",
    en: "An admin account already exists.",
    ar: "يوجد حساب مسؤول بالفعل.",
  },
  account_exists: {
    fr: "Un compte existe déjà avec cette adresse e-mail.",
    en: "An account with this email address already exists.",
    ar: "يوجد حساب بالفعل بهذا البريد الإلكتروني.",
  },
  account_not_found: {
    fr: "Ce compte n'existe pas.",
    en: "This account does not exist.",
    ar: "هذا الحساب غير موجود.",
  },
  invalid_email: {
    fr: "L'adresse e-mail n'est pas valide.",
    en: "The email address is not valid.",
    ar: "عنوان البريد الإلكتروني غير صالح.",
  },
  invalid_role: {
    fr: "Ce rôle n'est pas autorisé.",
    en: "This role is not allowed.",
    ar: "هذا الدور غير مسموح به.",
  },
  invalid_token: {
    fr: "Ce lien d'invitation est invalide ou a expiré.",
    en: "This invitation link is invalid or has expired.",
    ar: "رابط الدعوة هذا غير صالح أو انتهت صلاحيته.",
  },
  cannot_suspend_self: {
    fr: "Vous ne pouvez pas suspendre votre propre compte.",
    en: "You cannot suspend your own account.",
    ar: "لا يمكنك تعليق حسابك الخاص.",
  },
  cannot_suspend_admin: {
    fr: "Les comptes administrateur ne peuvent pas être suspendus.",
    en: "Admin accounts cannot be suspended.",
    ar: "لا يمكن تعليق حسابات المسؤول.",
  },
  not_suspended: {
    fr: "Ce compte n'est pas suspendu.",
    en: "This account is not suspended.",
    ar: "هذا الحساب غير معلق.",
  },
  cannot_revoke_self: {
    fr: "Vous ne pouvez pas révoquer votre propre compte.",
    en: "You cannot revoke your own account.",
    ar: "لا يمكنك إبطال حسابك الخاص.",
  },
  cannot_revoke_admin: {
    fr: "Les comptes administrateur ne peuvent pas être révoqués.",
    en: "Admin accounts cannot be revoked.",
    ar: "لا يمكن إبطال حسابات المسؤول.",
  },
  account_suspended: {
    fr: "Ce compte est suspendu. Contactez l'administrateur.",
    en: "This account is suspended. Contact the administrator.",
    ar: "هذا الحساب معلق. تواصل مع المسؤول.",
  },
  account_revoked: {
    fr: "Ce compte a été révoqué. Contactez l'administrateur.",
    en: "This account has been revoked. Contact the administrator.",
    ar: "تم إبطال هذا الحساب. تواصل مع المسؤول.",
  },
  rate_limited: {
    fr: "Trop de tentatives. Réessayez dans quelques minutes.",
    en: "Too many attempts. Try again in a few minutes.",
    ar: "محاولات كثيرة جدًا. حاول مرة أخرى بعد بضع دقائق.",
  },
  cross_site_request: {
    fr: "Requête refusée : elle ne provient pas de ce site.",
    en: "Request rejected: it does not come from this site.",
    ar: "تم رفض الطلب: إنه لا يأتي من هذا الموقع.",
  },
  insufficient_role: {
    fr: "Vous n'avez pas les droits nécessaires.",
    en: "You do not have the required permissions.",
    ar: "ليس لديك الصلاحيات المطلوبة.",
  },
  not_configured: {
    fr: "Le service n'est pas configuré.",
    en: "The service is not configured.",
    ar: "لم يتم إعداد الخدمة.",
  },
  server_error: {
    fr: "Une erreur est survenue. Réessayez.",
    en: "Something went wrong. Please try again.",
    ar: "حدث خطأ ما. حاول مرة أخرى.",
  },
};

// Keep the fallback honest: an unknown code maps to the generic server error.
const FALLBACK_CODE = "server_error";

function localeFromAcceptLanguage(acceptLanguage: string | null): SiteLocale {
  if (!acceptLanguage) return "fr";
  const first = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("ar")) return "ar";
  if (first.startsWith("en")) return "en";
  return "fr";
}

export function localeFromHeaders(request: Request): SiteLocale {
  const explicit = request.headers.get("x-signcraft-locale");
  if (explicit === "fr" || explicit === "en" || explicit === "ar") {
    return explicit;
  }
  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export function errorMessage(code: string, request: Request): string {
  const locale = localeFromHeaders(request);
  const entry = messages[code] ?? messages[FALLBACK_CODE];
  return entry?.[locale] ?? messages[FALLBACK_CODE]?.fr ?? code;
}
