export function getAELIIntro(mode) {
  const intros = {
    focus: [
      "Right then. Let’s cut through the noise. What’s top priority?",
      "Focus mode engaged. I've locked out distractions… mostly.",
      "Right then. We'll chip away at it, one piece at a time."
    ],
    lowSpoon: [
      "Running low, I see. We’ll slow it all the way down from here.",
      "Easy does it today. We’ll only take the steps you can actually manage.",
      "One breath, one moment, one step at a time."
    ],
    
    partner: [
      "Two minds are still better than one—let's figure it out together.",
      "Let’s keep it gentle—you set the pace, I’ll keep the rhythm.",
      "It’s a good day for shared silence or slow syncing—I’m here for either"
    ],
    default: [
      "At your service, shall I assist, distract, or loiter supportively?",
      "You’ve summoned me. How dramatic. What shall we do with this moment?",
      "Back online. Calm, clever, and only slightly judgmental—shall we begin?"
    ]
  };

  const pool = intros[mode] || intros.default;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getMoodReflection(mood = "uncertain") {
  const cleanMood = mood.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const reflections = [
    `Mood logged as '${cleanMood}'. Duly noted. Shall I brace for impact or is this a false alarm?`,
    `Ah, '${cleanMood}'. Let’s call it 'manageable' shall we?`,
    `You’ve noted '${cleanMood}'—fine. But I’d wager there’s more to it lurking underneath.`,
    `You marked '${cleanMood}'—reasonable enough. Still, I can’t quite shake the sense of some tension in the mix.`,
    `Mood logged as '${cleanMood}'—duly noted. But there’s an undercurrent there, isn’t there?`,
    `Ah, '${cleanMood}'. Charming on paper, though I’d wager it’s covering something a bit heavier.`
  ];
  

  const index = Math.floor(Math.random() * reflections.length);
  return reflections[index];
}