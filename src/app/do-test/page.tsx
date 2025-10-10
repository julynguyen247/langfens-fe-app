import PassageView from "./components/PassageView";
import QuestionPanel from "./components/QuestionPanel";

export default function PracticeDoPage() {
  const passage = {
    title: "The kākāpō",
    content: "The kākāpō is a nocturnal, flightless parrot...",
  };

  const questions = [
    {
      id: 1,
      stem: "There are other parrots that share the kākāpō’s inability to fly.",
      choices: ["True", "False", "Not given"],
    },
    // ...
  ];

  return (
    <>
      <PassageView passage={passage} />
      <QuestionPanel questions={questions} />
    </>
  );
}
