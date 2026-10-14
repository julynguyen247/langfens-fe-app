import { apisDictionary } from "../utils/api.customize";

export async function suggestDictionary(word: string, pos?: string) {
  const res = await apisDictionary.get("/dictionary/suggest", {
    params: {
      word,
      pos,
    },
  });
  return res.data;
}

export async function getDictionaryDetails(id: number) {
  const res = await apisDictionary.get(`/dictionary/details/${id}`);
  return res.data;
}

export async function lookupDictionary(word: string) {
  const res = await apisDictionary.get("/dictionary/lookup", {
    params: { word },
  });
  return res.data;
}
