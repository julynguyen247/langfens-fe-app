// Home Page Redesign - TypeScript Types

// ====================================
// ATTEMPT TYPES
// ====================================

export type Skill = "Reading" | "Listening" | "Writing" | "Speaking";

export interface Attempt {
  id: string;
  title: string;
  skill: Skill;
  dateISO: string;
  score?: number;
  durationMin: number;
}

// ====================================
// PLACEMENT TYPES
// ====================================

export interface PlacementStatus {
  completed: boolean;
  attemptId: string;
  level: string;
  band: number;
}

// ====================================
// ANALYTICS TYPES
// ====================================

export interface AnalyticsSummary {
  totalAttempts: number;
  totalStudyTimeMin: number;
  avgScore: number;
  currentStreak: number;
  testsBySkill: Record<string, number>;
}

// ====================================
// GAMIFICATION TYPES
// ====================================

export interface GamificationStats {
  level: number;
  currentXP: number;
  totalXP: number;
  dailyTargetXP: number;
  todayXP: number;
  currentStreak: number;
  longestStreak: number;
}

// ====================================
// SKILL PROGRESS TYPES
// ====================================

export interface SkillProgress {
  skill: Skill;
  currentScore: number;
  targetScore: number;
  examCount: number;
}

// ====================================
// ACHIEVEMENT TYPES
// ====================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-100
  isUnlocked: boolean;
  xpReward: number;
  iconType: "streak" | "score" | "time" | "tests" | "skill";
}

// ====================================
// LEADERBOARD TYPES
// ====================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  avatarUrl?: string;
}

// ====================================
// ACTIVITY TYPES
// ====================================

export interface ActivityItem {
  id: string;
  title: string;
  skill: Skill;
  score?: number;
  dateISO: string;
  attemptId: string;
}

// ====================================
// COMPONENT PROPS TYPES
// ====================================

export interface HeroDashboardProps {
  userName: string;
  streak: number;
  level: number;
  currentXP: number;
  dailyTargetXP: number;
  todayXP: number;
}

export interface StatsRowProps {
  totalAttempts: number;
  avgScore: number;
  totalStudyTimeMin: number;
  streak: number;
}

export interface TodayGoalProps {
  todayXP: number;
  dailyTargetXP: number;
}

export interface ContinueLearningCardProps {
  lastAttempt?: Attempt;
  weakestSkill?: Skill;
  onStartPractice: () => void;
}

export interface SkillProgressGridProps {
  skills: SkillProgress[];
  onSkillClick: (skill: Skill) => void;
}

export interface SkillCardProps {
  skill: Skill;
  currentScore: number;
  targetScore: number;
  examCount: number;
  onClick: () => void;
}

export interface AchievementsWidgetProps {
  achievements: Achievement[];
  onViewAll: () => void;
}

export interface LeaderboardWidgetProps {
  topUsers: LeaderboardEntry[];
  currentUserRank?: number;
  currentUserId: string;
  onViewAll: () => void;
}

export interface RecentActivityTimelineProps {
  attempts: ActivityItem[];
  onViewAttempt: (attemptId: string, skill: Skill) => void;
  onViewAll: () => void;
}

export interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export interface XPRingProps {
  currentXP: number;
  targetXP: number;
  size?: number;
  strokeWidth?: number;
}
