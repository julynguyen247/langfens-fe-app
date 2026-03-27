import { RoleplayScenario } from "@/types/speaking";

export const MOCK_SCENARIOS: RoleplayScenario[] = [
  {
    id: "1",
    slug: "hotel-check-in",
    title: "Hotel Check-in",
    difficulty: "BAND_5",
    ielts_part: "PART_3",
    context:
      "You are checking into a hotel in London. The hotel receptionist is asking about your reservation and preferences.",
    user_role: "Guest checking into a hotel",
    agent_role: "Hotel receptionist",
    opening_prompt:
      "Good afternoon! Welcome to the Grand London Hotel. Do you have a reservation with us?",
    target_vocabulary: ["reservation", "check-in", "double room", "wake-up call"],
    target_grammar: ["past simple", "present perfect", "would like"],
    suggested_topics: ["hotel amenities", "room preferences", "local attractions"],
    duration_min: 5,
    turn_count_target: 8,
  },
  {
    id: "2",
    slug: "restaurant-reservation",
    title: "Restaurant Reservation",
    difficulty: "BAND_6",
    ielts_part: "PART_3",
    context:
      "You are calling a popular restaurant to make a reservation for dinner with your family.",
    user_role: "Customer making a reservation",
    agent_role: "Restaurant host/hostess",
    opening_prompt:
      "Thank you for calling Le Petit Bistro. How may I assist you this evening?",
    target_vocabulary: ["reservation", "seating", "dietary requirements", "cancellation"],
    target_grammar: ["conditional", "polite requests", "future tenses"],
    suggested_topics: ["menu questions", "special occasions", "dress code"],
    duration_min: 5,
    turn_count_target: 10,
  },
  {
    id: "3",
    slug: "travel-directions",
    title: "Travel Directions",
    difficulty: "BAND_5",
    ielts_part: "PART_3",
    context:
      "You are a tourist in an unfamiliar city and need to ask for directions to reach your destination.",
    user_role: "Tourist asking for directions",
    agent_role: "Local resident",
    opening_prompt:
      "Oh, hello there! You look a bit lost. Can I help you with something?",
    target_vocabulary: ["directions", "landmarks", "blocks", "intersection"],
    target_grammar: ["imperatives", "prepositions of movement", "asking politely"],
    suggested_topics: ["public transport", "nearby places", "walking time"],
    duration_min: 4,
    turn_count_target: 6,
  },
];
