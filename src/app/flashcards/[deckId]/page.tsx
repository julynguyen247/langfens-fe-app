"use client";
import { useParams } from "next/navigation";
import StudyHeader from "../components/study/StudyHeader";
import ProgressBar from "../components/study/ProgressBar";
import Flashcard from "../components/study/Flashcard";
import StudyFooter from "../components/study/StudyFooter";
import useDeckStudy from "../components/study/useDeckStudy";

const MOCK_CARDS = [
  {
    id: "1",
    front: "abandon",
    back: "từ bỏ; bỏ rơi",
    example: "He abandoned the game early.",
  },
  {
    id: "2",
    front: "accurate",
    back: "chính xác",
    example: "The report is accurate.",
  },
  {
    id: "3",
    front: "benefit",
    back: "lợi ích",
    example: "This plan benefits everyone.",
  },
  {
    id: "4",
    front: "candidate",
    back: "ứng viên",
    example: "We interviewed three candidates.",
  },
];

export function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const study = useDeckStudy(MOCK_CARDS);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <StudyHeader
        deckTitle={`Học bộ thẻ: ${deckId}`}
        current={study.index + 1}
        total={study.total}
        onExit={study.handleExit}
      />
      <div className="mt-4">
        <ProgressBar
          value={Math.round(((study.index + 1) / study.total) * 100)}
        />
      </div>

      <section className="mt-6">
        <Flashcard
          key={study.card.id}
          card={study.card}
          flipped={study.flipped}
          onFlip={study.flip}
        />
      </section>

      <StudyFooter
        flipped={study.flipped}
        onFlip={study.flip}
        onPrev={study.prev}
        onNext={study.next}
        onAgain={study.again}
        onKnow={study.know}
        index={study.index}
        total={study.total}
        shuffle={study.shuffle}
        onToggleShuffle={study.toggleShuffle}
      />
    </main>
  );
}

export default StudyPage;
