import api from "@/lib/axios";
import { FetchTranslationsApi } from "@/routes/api";
import type { FetchTranslationsPayload, TranslationMap } from "@/modules/settings/languages/types";



export const fetchTranslationsApi = async ({
  lang,
  forceFetch = false,
}: FetchTranslationsPayload): Promise<TranslationMap> => {
  const response = await api.get(`${FetchTranslationsApi.url}?lang=${lang}&forceFetch=${forceFetch}`);
  return response.data.translations as TranslationMap;
};