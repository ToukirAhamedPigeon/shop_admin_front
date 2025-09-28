export interface TranslationMap {
    [key: string]: string;
  }

  export interface FetchTranslationsPayload {
    lang: string;
    forceFetch?: boolean;
  }