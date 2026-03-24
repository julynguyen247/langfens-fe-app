"use client";

import { motion } from "framer-motion";
import SkillCard from "./SkillCard";
import type { SkillProgressGridProps } from "../types";

const skillRouteMap: Record<string, string> = {
  Reading: "/practice?skill=reading",
  Listening: "/practice?skill=listening",
  Writing: "/practice?skill=writing",
  Speaking: "/practice?skill=speaking",
};

export default function SkillProgressGrid({
  skills,
  onSkillClick,
}: SkillProgressGridProps) {
  return (
    <section className="space-y-5">
      <motion.h2
        className="text-xl font-bold text-slate-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        Skill Progress
      </motion.h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skills.map((skillData, index) => (
          <motion.div
            key={skillData.skill}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
          >
            <SkillCard
              skill={skillData.skill}
              currentScore={skillData.currentScore}
              targetScore={skillData.targetScore}
              examCount={skillData.examCount}
              onClick={() => onSkillClick(skillData.skill)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
