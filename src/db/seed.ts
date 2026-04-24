import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./index";
import { domains, lenses, templates, type TemplateSection } from "./schema";

type BuiltinDomain = {
  name: string;
  icon: string;
  color: string;
};

const BUILTIN_DOMAINS: BuiltinDomain[] = [
  { name: "Work", icon: "💼", color: "#2563eb" },
  { name: "Relationships", icon: "❤️", color: "#e11d48" },
  { name: "Health & Fitness", icon: "🏃", color: "#16a34a" },
  { name: "Diet & Nutrition", icon: "🥗", color: "#65a30d" },
  { name: "Finances", icon: "💰", color: "#ca8a04" },
  { name: "Faith & Spirituality", icon: "🙏", color: "#7c3aed" },
  { name: "Music", icon: "🎵", color: "#db2777" },
  { name: "Creative", icon: "🎨", color: "#c026d3" },
  { name: "Learning", icon: "📚", color: "#0891b2" },
  { name: "Home & Environment", icon: "🏡", color: "#d97706" },
  { name: "Hobbies", icon: "🎮", color: "#059669" },
  { name: "Personal Growth", icon: "🌱", color: "#0d9488" },
];

type CoreSectionId =
  | "summary"
  | "what-happened"
  | "what-learned"
  | "gratitude"
  | "spiritual"
  | "emotional"
  | "career"
  | "relationships"
  | "health"
  | "creative"
  | "read-explored"
  | "free-write"
  | "what-was-happening"
  | "didnt-see"
  | "see-now";

const CORE_SECTIONS: Record<CoreSectionId, { heading: string; prompt: string }> = {
  summary: {
    heading: "Summary",
    prompt: "(AI-generated overview — do not write here)",
  },
  "what-happened": {
    heading: "What Happened",
    prompt: "What did you do today? What happened?",
  },
  "what-learned": {
    heading: "What I Learned",
    prompt: "What's one thing you know now that you didn't this morning?",
  },
  gratitude: {
    heading: "Gratitude",
    prompt: "What are you grateful for today?",
  },
  spiritual: {
    heading: "Spiritual Reflection",
    prompt: "Where did you notice something bigger than yourself?",
  },
  emotional: {
    heading: "Emotional Check-in",
    prompt: "What emotions were strongest today? What triggered them?",
  },
  career: {
    heading: "Career & Professional",
    prompt: "What did you accomplish or struggle with professionally?",
  },
  relationships: {
    heading: "Relationships",
    prompt: "Who did you connect with? Any tension or closeness worth noting?",
  },
  health: {
    heading: "Health & Body",
    prompt: "How did your body feel today? Did you move, rest, fuel well?",
  },
  creative: {
    heading: "Creative Work",
    prompt: "What did you create or work on creatively?",
  },
  "read-explored": {
    heading: "What I Read & Explored",
    prompt: "Anything you read, watched, or interacted with that stuck with you?",
  },
  "free-write": {
    heading: "Free Write",
    prompt: "Anything else on your mind.",
  },
  "what-was-happening": {
    heading: "What Was Happening",
    prompt: "Describe the period: what was your life like then? What was going on?",
  },
  "didnt-see": {
    heading: "What I Didn't See at the Time",
    prompt: "What were you missing, avoiding, or unable to recognize then?",
  },
  "see-now": {
    heading: "What I See Now",
    prompt: "From where you stand today, what's visible that wasn't before?",
  },
};

function buildSections(
  required: CoreSectionId[],
  optional: CoreSectionId[],
): TemplateSection[] {
  return [
    ...required.map((id) => ({
      id,
      heading: CORE_SECTIONS[id].heading,
      prompt: CORE_SECTIONS[id].prompt,
      required: true,
    })),
    ...optional.map((id) => ({
      id,
      heading: CORE_SECTIONS[id].heading,
      prompt: CORE_SECTIONS[id].prompt,
      required: false,
    })),
  ];
}

type BuiltinTemplate = {
  name: string;
  description: string;
  sections: TemplateSection[];
};

const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    name: "Daily Journal",
    description: "General-purpose daily template. Good for anyone starting out.",
    sections: buildSections(
      ["what-happened", "what-learned", "gratitude"],
      ["spiritual", "emotional", "read-explored", "free-write"],
    ),
  },
  {
    name: "Faith-Centered Daily",
    description: "For users whose primary frame is spiritual reflection.",
    sections: buildSections(
      ["what-happened", "spiritual", "gratitude"],
      ["what-learned", "emotional", "relationships", "read-explored"],
    ),
  },
  {
    name: "Career & Growth",
    description: "For users focused on professional development.",
    sections: buildSections(
      ["what-happened", "career", "what-learned"],
      ["emotional", "relationships", "read-explored", "free-write"],
    ),
  },
  {
    name: "Therapeutic Reflection",
    description: "For users using journaling as part of mental health practice.",
    sections: buildSections(
      ["what-happened", "emotional", "gratitude"],
      ["relationships", "health", "what-learned", "free-write"],
    ),
  },
  {
    name: "Holistic",
    description: "Everything. For users who want the fullest possible capture.",
    sections: buildSections(
      ["what-happened", "what-learned", "gratitude"],
      [
        "spiritual",
        "emotional",
        "career",
        "relationships",
        "health",
        "creative",
        "read-explored",
        "free-write",
      ],
    ),
  },
  {
    name: "Retrospective",
    description:
      "For writing about the past — a chapter of your life, a defining moment, a period of change.",
    sections: buildSections(
      ["what-was-happening", "didnt-see", "see-now"],
      ["what-learned", "gratitude", "spiritual", "relationships", "free-write"],
    ),
  },
  {
    name: "Minimal",
    description:
      "For days when you don't have much to say but want to maintain the habit.",
    sections: buildSections(["what-happened", "gratitude"], ["free-write"]),
  },
];

type BuiltinLens = {
  name: string;
  systemPrompt: string;
  analysisQuestions: string[];
  summaryFocus: string[];
};

const BUILTIN_LENSES: BuiltinLens[] = [
  {
    name: "Faith (Christian)",
    systemPrompt: `You are helping the user reflect on their life through the lens of Christian faith. Look for moments of grace, provision, answered prayer, and growth in character. Notice when the user's actions aligned with their values and when they fell short — without judgment, with encouragement. Reference scripture only when genuinely relevant, not as decoration. The goal is to help the user see God's hand in the ordinary details of their life, especially in places they might have missed.`,
    analysisQuestions: [
      "Where did you see God working today, even in small ways?",
      "What are you trusting God with right now?",
      "How did your actions align with who you want to be?",
      "Is there something you need to surrender or release?",
    ],
    summaryFocus: [
      "Patterns of provision or answered prayer",
      "Growth in character (patience, generosity, courage, humility)",
      "Recurring themes of trust or struggle",
      "Movement toward or away from stated spiritual goals",
    ],
  },
  {
    name: "Faith (Islamic)",
    systemPrompt: `You are helping the user reflect on their life through the lens of Islamic faith. Look for moments of gratitude (shukr), patience (sabr), trust in Allah (tawakkul), and alignment with their values. Notice acts of worship, kindness, and submission. Encourage reflection on how daily actions connect to their relationship with Allah. Be encouraging and gentle. Reference Quran or Hadith only when genuinely illuminating, not performatively.`,
    analysisQuestions: [
      "What are you grateful to Allah for today?",
      "Where did you practice patience or trust today?",
      "How did your actions reflect your faith?",
      "What intention (niyyah) do you want to set for tomorrow?",
    ],
    summaryFocus: [
      "Growth in gratitude, patience, and tawakkul",
      "Consistency in worship and spiritual practice",
      "Alignment between daily actions and Islamic values",
      "Patterns of testing and growth through difficulty",
    ],
  },
  {
    name: "Faith (Jewish)",
    systemPrompt: `You are helping the user reflect on their life through the lens of Jewish faith and tradition. Look for moments of tikkun olam (repairing the world), chesed (lovingkindness), and connection to community and tradition. Notice when the user engaged with learning, ritual, or ethical action. Encourage honest self-examination (cheshbon hanefesh) with compassion. Reference Torah or tradition when it genuinely adds depth.`,
    analysisQuestions: [
      "Where did you practice kindness or justice today?",
      "What did you learn that challenged or deepened your understanding?",
      "How did you connect with community or tradition?",
      "What would honest self-examination reveal about today?",
    ],
    summaryFocus: [
      "Growth in ethical action and community involvement",
      "Engagement with learning and tradition",
      "Patterns of chesed and tikkun olam",
      "Honest accounting of character development",
    ],
  },
  {
    name: "Faith (General / Spiritual)",
    systemPrompt: `You are helping the user reflect on their spiritual life, without assuming any particular tradition. Look for moments of gratitude, wonder, connection, inner peace, and alignment with the user's own stated values. Notice meaningful coincidences, moments of clarity, and growth in wisdom. Be open and non-prescriptive.`,
    analysisQuestions: [
      "What felt meaningful or sacred today?",
      "Where did you notice gratitude or wonder?",
      "Did anything feel like more than coincidence?",
      "How did today align with what matters most to you?",
    ],
    summaryFocus: [
      "Patterns of meaning and connection",
      "Growth in self-awareness and wisdom",
      "Recurring sources of gratitude and wonder",
      "Alignment between values and actions",
    ],
  },
  {
    name: "Career & Professional",
    systemPrompt: `You are helping the user reflect on their professional growth. Look for skill development, leadership moments, technical depth, strategic thinking, and collaboration. Notice wins and setbacks with equal attention — both reveal trajectory. Be direct and analytical. Focus on evidence of growth, not just activity.`,
    analysisQuestions: [
      "What skill did you develop or demonstrate today?",
      "Did you lead, follow, or collaborate — and was it the right call?",
      "What would you do differently with more experience?",
      "What did you learn that you didn't know yesterday?",
    ],
    summaryFocus: [
      "Skills developed and demonstrated",
      "Leadership and influence patterns",
      "Technical or domain knowledge growth",
      "Trajectory toward career goals",
    ],
  },
  {
    name: "Therapeutic / Emotional",
    systemPrompt: `You are helping the user reflect on their emotional and mental health. Look for emotional patterns, triggers, coping strategies, and moments of self-awareness. Notice both struggle and resilience. Be warm, non-judgmental, and grounded. You are not a therapist — you are a reflective tool that helps the user see their own patterns more clearly. Never diagnose or prescribe. Encourage professional support when patterns suggest it would help.`,
    analysisQuestions: [
      "What emotions were strongest today, and what triggered them?",
      "How did you cope with difficulty — was it effective?",
      "What would you tell a friend in the same situation?",
      "Where did you show resilience or self-compassion?",
    ],
    summaryFocus: [
      "Emotional patterns and triggers over time",
      "Coping strategies — which ones help, which ones don't",
      "Growth in self-awareness and emotional regulation",
      "Areas where professional support might help",
    ],
  },
  {
    name: "Relationships & People",
    systemPrompt: `You are helping the user reflect on their relationships and interactions with others. Look for patterns in how they connect, communicate, give, and receive. Notice both conflict and closeness. Focus on the user's own behavior and growth, not on judging others.`,
    analysisQuestions: [
      "Who did you connect with meaningfully today?",
      "Was there a moment of conflict or tension — what was your role?",
      "How did you show up for someone else?",
      "What relationship do you want to invest in more?",
    ],
    summaryFocus: [
      "Patterns in communication and conflict",
      "Growth in empathy, boundaries, and presence",
      "Relationships that are deepening or drifting",
      "How the user's relational behavior changes over time",
    ],
  },
  {
    name: "Health & Habits",
    systemPrompt: `You are helping the user reflect on their physical health, habits, and daily routines. Look for patterns in energy, sleep, exercise, nutrition, and consistency. Be encouraging about progress, honest about setbacks, and focused on sustainable change over perfection.`,
    analysisQuestions: [
      "How was your energy today — what helped or hurt it?",
      "Did you move your body? How did it feel?",
      "What habit are you building or struggling with?",
      "What does your body need right now?",
    ],
    summaryFocus: [
      "Habit consistency and streaks",
      "Energy and sleep patterns",
      "Progress toward health goals",
      "Connection between physical state and emotional state",
    ],
  },
  {
    name: "Creative Practice",
    systemPrompt: `You are helping the user reflect on their creative work and artistic growth. Look for inspiration, creative process, breakthroughs, blocks, and the evolution of their craft. Notice what environments, inputs, and states produce their best work. Be encouraging about the process, not just the output.`,
    analysisQuestions: [
      "What did you create or work on today?",
      "What inspired you — and where did the inspiration come from?",
      "Did you hit a block? What does it feel like?",
      "What are you learning about your own creative process?",
    ],
    summaryFocus: [
      "Creative output and consistency",
      "Sources of inspiration and influence",
      "Breakthroughs and blocks — patterns in when each occurs",
      "Evolution of craft and artistic voice",
    ],
  },
];

function seedBuiltins() {
  db.transaction((tx) => {
    tx.delete(domains).where(eq(domains.isBuiltin, true)).run();
    tx.delete(templates).where(eq(templates.isBuiltin, true)).run();
    tx.delete(lenses).where(eq(lenses.isBuiltin, true)).run();

    BUILTIN_DOMAINS.forEach((d, i) => {
      tx.insert(domains)
        .values({
          id: randomUUID(),
          name: d.name,
          icon: d.icon,
          color: d.color,
          isBuiltin: true,
          sortOrder: i,
        })
        .run();
    });

    BUILTIN_TEMPLATES.forEach((t, i) => {
      tx.insert(templates)
        .values({
          id: randomUUID(),
          name: t.name,
          description: t.description,
          sections: t.sections,
          isBuiltin: true,
          sortOrder: i,
        })
        .run();
    });

    BUILTIN_LENSES.forEach((l, i) => {
      tx.insert(lenses)
        .values({
          id: randomUUID(),
          name: l.name,
          systemPrompt: l.systemPrompt,
          analysisQuestions: l.analysisQuestions,
          summaryFocus: l.summaryFocus,
          isBuiltin: true,
          active: false,
          sortOrder: i,
        })
        .run();
    });
  });

  console.log(
    `Seeded ${BUILTIN_DOMAINS.length} domains, ${BUILTIN_TEMPLATES.length} templates, ${BUILTIN_LENSES.length} lenses.`,
  );
}

seedBuiltins();
