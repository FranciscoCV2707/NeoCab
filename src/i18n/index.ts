import { useState, useCallback, useEffect } from "react";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import ptbr from "./pt-br.json";
import ja from "./ja.json";
import zhcn from "./zh-CN.json";
import ko from "./ko.json";
import ru from "./ru.json";
import it from "./it.json";

export type Locale = "en" | "es" | "fr" | "de" | "pt-br" | "ja" | "zh-CN" | "ko" | "ru" | "it";

const bundles: Record<Locale, Record<string, string>> = {
  en, es, fr, de, "pt-br": ptbr, ja, "zh-CN": zhcn, ko, ru, it,
};

const LOCALE_KEY = "neocab_locale";

function detectLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved && (saved in bundles)) return saved as Locale;
  const nav = navigator.language.split("-")[0];
  if (nav in bundles) return nav as Locale;
  const localeMap: Record<string, Locale> = {
  pt: "pt-br",
  zh: "zh-CN",
};
  return localeMap[nav] || "en";
}

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
}

export function getLocale(): Locale {
  return detectLocale();
}

export function rawT(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const bundle = bundles[locale];
  let template = bundle[key];
  if (!template) {
    template = bundles.en[key];
  }
  if (!template) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.replace(`{${k}}`, String(v));
    }
  }
  return template;
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  const changeLocale = useCallback((l: Locale) => {
    setLocale(l);
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      return rawT(locale, key, vars);
    },
    [locale]
  );

  return { t, locale, changeLocale };
}

// Legacy sync t() for gradual migration — uses detected locale each call
export function t(key: string, vars?: Record<string, string | number>): string {
  return rawT(detectLocale(), key, vars);
}
