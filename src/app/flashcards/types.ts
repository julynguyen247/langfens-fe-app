export type ApiDeck = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  descriptionMd?: string;
  status: string;
  category?: string;
  cardCount?: number;
  createdAt?: string;
  updatedAt?: string;
  mastery?: number;
  lastStudied?: string;
};

export type Subscription = {
  id: string;
  title: string;
  deckId: string;
  status: string;
  category?: string;
  cardCount?: number;
  subscribeAt?: string;
  mastery?: number;
  lastStudied?: string;
};

export type TabKey = "own" | "subs";
