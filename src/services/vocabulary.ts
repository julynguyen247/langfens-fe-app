import { apisVocabulary } from "../utils/api.customize";

export async function createDeck(payload: {
  slug: string;
  title: string;
  descriptionMd: string;
  category: string;
  status: "draft" | "published";
  userId: string;
}) {
  const res = await apisVocabulary.post("/users/deck", payload);
  return res;
}

export async function createDeckCard(
  deckId: string,
  payload: {
    frontMd: string;
    backMd: string;
    hintMd?: string;
  }
) {
  const res = await apisVocabulary.post(`/users/deck/${deckId}/card`, payload);
  return res;
}

// Bulk create cards - single API call
export async function createBulkCards(
  deckId: string,
  cards: Array<{
    frontMd: string;
    backMd: string;
    hintMd?: string;
  }>
) {
  // Backend expects PascalCase: Cards, FrontMd, BackMd, HintMd
  const payload = {
    Cards: cards.map(c => ({
      FrontMd: c.frontMd,
      BackMd: c.backMd,
      HintMd: c.hintMd || null
    }))
  };
  const res = await apisVocabulary.post(`/users/deck/${deckId}/cards`, payload);
  return res;
}

export async function updateDeck(
  deckId: string,
  payload: {
    slug: string;
    title: string;
    description: string;
    category: string;
    status: "draft" | "published";
  }
) {
  const res = await apisVocabulary.put(`/users/deck/${deckId}`, payload);
  return res;
}

export async function updateCard(
  cardId: string,
  payload: {
    frontMd: string;
    backMd: string;
    hintMd: string;
  }
) {
  const res = await apisVocabulary.put(`/users/deck/card/${cardId}`, payload);
  return res;
}

export async function deleteCard(cardId: string) {
  const res = await apisVocabulary.delete(`/users/deck/card/${cardId}`);
  return res;
}

export async function getOwnDecks(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/own`);
  return res;
}

export async function getDeckCards(deckId: string) {
  const res = await apisVocabulary.get(`/decks/deck:${deckId}/cards`);
  return res;
}

export async function getDueFlashcards(userId: string, limit: number = 20) {
  const res = await apisVocabulary.get(`/users/${userId}/flashcard/due`, {
    params: { limit },
  });
  return res;
}

export async function reviewFlashcard(
  userId: string,
  cardId: string,
  grade: number
) {
  const res = await apisVocabulary.post(
    `/users/${userId}/flashcard/${cardId}/review`,
    {
      grade,
    }
  );
  return res;
}

export async function getFlashcardProgress(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/flashcard/progress`);
  return res;
}

export async function getPublicHandler(params?: {
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisVocabulary.get("/decks", {
    params: {
      status: params?.status ?? "",
      category: params?.category ?? "",
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  return res;
}

export async function subscribeDeck(userId: string, deckId: string) {
  const res = await apisVocabulary.post(`/users/${userId}/subscribe/${deckId}`);
  return res;
}

export async function getUserSubscriptions(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/subscribe`);
  return res;
}

export async function unsubscribeDeck(userId: string, deckId: string) {
  const res = await apisVocabulary.delete(`/users/${userId}/subscribe/${deckId}`);
  return res;
}

export async function enrichVocabulary(word: string) {
  const res = await apisVocabulary.get("/vocabulary/enrich", {
    params: { word },
  });
  return res.data;
}

export async function extractVocabulary(passageText: string, maxWords: number = 10) {
  const res = await apisVocabulary.post("/vocabulary/extract", {
    passageText,
    maxWords,
  });
  return res.data;
}
