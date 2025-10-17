import DeckCard from "./components/DeckCard";
import PageHeader from "./components/PageHeader";
import PromoBanner from "./components/PromoBanner";

const DECKS = [
  {
    id: "office-en",
    title: "Từ vựng tiếng Anh văn phòng",
    cards: 536,
    learners: 28713,
    author: { name: "langfens" },
  },
  {
    id: "intermediate-comm",
    title: "Từ vựng tiếng Anh giao tiếp trung cấp",
    cards: 798,
    learners: 17820,
    author: { name: "langfens" },
  },
  {
    id: "basic-comm",
    title: "Từ vựng Tiếng Anh giao tiếp cơ bản",
    cards: 993,
    learners: 44295,
    author: { name: "langfens" },
  },
  {
    id: "toefl-900",
    title: "900 từ TOEFL (có ảnh)",
    cards: 899,
    learners: 8049,
    hasImage: true,
    author: { name: "langfens" },
  },
  {
    id: "ielts-900",
    title: "900 từ IELTS (có ảnh)",
    cards: 899,
    learners: 34776,
    hasImage: true,
    author: { name: "langfens" },
  },
  {
    id: "sat-900",
    title: "900 từ SAT (có ảnh)",
    cards: 860,
    learners: 3171,
    hasImage: true,
    author: { name: "langfens" },
  },
  {
    id: "gre-gmat",
    title: "GRE-GMAT Vocabulary List",
    cards: 868,
    learners: 834,
    author: { name: "langfens" },
  },
  {
    id: "academic",
    title: "Academic word list",
    cards: 570,
    learners: 4029,
    author: { name: "langfens" },
  },
];

export default function FlashcardsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-indigo-900">
      <PageHeader />

      <PromoBanner />
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DECKS.map((d) => (
          <DeckCard key={d.id} deck={d} />
        ))}
      </section>
    </main>
  );
}
