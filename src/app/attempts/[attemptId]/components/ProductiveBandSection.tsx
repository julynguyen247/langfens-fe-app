"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WritingDetail, SpeakingDetail } from "../types";
import { CriterionCard } from "./CriterionCard";

export function ProductiveBandSection({
  skill,
  band,
  writingGrade,
  speakingGrade,
}: {
  skill: "WRITING" | "SPEAKING";
  band?: number;
  writingGrade?: WritingDetail;
  speakingGrade?: SpeakingDetail;
}) {
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="space-y-6">
      {/* Writing Grade Details */}
      {skill === "WRITING" && writingGrade && (
        <div className="space-y-6">
          {/* Task Prompt */}
          {writingGrade.taskText && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--text-muted)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Task Prompt
              </h3>
              <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-wrap">
                {writingGrade.taskText}
              </p>
            </section>
          )}

          {/* Criteria Cards Grid */}
          <section className="grid md:grid-cols-2 gap-4">
            {writingGrade.taskResponse && (
              <CriterionCard
                title="Task Response"
                criterion={writingGrade.taskResponse}
              />
            )}
            {writingGrade.coherenceAndCohesion && (
              <CriterionCard
                title="Coherence & Cohesion"
                criterion={writingGrade.coherenceAndCohesion}
              />
            )}
            {writingGrade.lexicalResource && (
              <CriterionCard
                title="Lexical Resource"
                criterion={writingGrade.lexicalResource}
              />
            )}
            {writingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard
                title="Grammatical Range & Accuracy"
                criterion={writingGrade.grammaticalRangeAndAccuracy}
              />
            )}
          </section>

          {/* Suggestions */}
          {writingGrade.suggestions && writingGrade.suggestions.length > 0 && (
            <section className="rounded-[2rem] border-[3px] border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--primary-light)] p-6">
              <h3
                className="font-bold text-[var(--primary-dark)] mb-3"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Improvement Suggestions
              </h3>
              <ul className="text-sm text-[var(--text-body)] space-y-2">
                {writingGrade.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--primary)] font-bold">
                      {i + 1}.
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Improved Paragraph Toggle */}
          {writingGrade.improvedParagraph && (
            <>
              <button
                onClick={() => setShowModel(!showModel)}
                className="w-full py-3 rounded-full bg-[var(--foreground)] text-white font-bold text-sm border-b-[4px] border-black hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {showModel ? "Hide Model Answer" : "View Model Answer"}
              </button>

              <AnimatePresence>
                {showModel && (
                  <motion.div
                    className="bg-[var(--foreground)] text-white rounded-[2rem] border-[3px] border-[var(--foreground)] shadow-[0_4px_0_rgba(0,0,0,0.3)] p-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3
                      className="font-bold mb-3"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Improved Version
                    </h3>
                    <p className="text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                      {writingGrade.improvedParagraph}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Speaking Grade Details */}
      {skill === "SPEAKING" && speakingGrade && (
        <div className="space-y-6">
          {speakingGrade.taskText && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Task prompt
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.taskText}
              </div>
            </section>
          )}

          {speakingGrade.transcript && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Transcript
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.transcript}
              </div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            {speakingGrade.fluencyAndCoherence && (
              <CriterionCard
                title="Fluency & Coherence"
                criterion={speakingGrade.fluencyAndCoherence}
              />
            )}
            {speakingGrade.lexicalResource && (
              <CriterionCard
                title="Lexical Resource"
                criterion={speakingGrade.lexicalResource}
              />
            )}
            {speakingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard
                title="Grammatical Range & Accuracy"
                criterion={speakingGrade.grammaticalRangeAndAccuracy}
              />
            )}
            {speakingGrade.pronunciation && (
              <CriterionCard
                title="Pronunciation"
                criterion={speakingGrade.pronunciation}
              />
            )}
          </section>

          {speakingGrade.suggestions &&
            speakingGrade.suggestions.length > 0 && (
              <section className="rounded-[2rem] border-[3px] border-[var(--skill-speaking-border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--skill-speaking-light)] p-6">
                <h3
                  className="text-sm font-bold text-[var(--skill-speaking)] mb-2"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Improvement suggestions
                </h3>
                <ul className="list-disc list-inside text-sm text-[var(--skill-speaking)] space-y-1">
                  {speakingGrade.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

          {speakingGrade.improvedAnswer && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Improved answer
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.improvedAnswer}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
