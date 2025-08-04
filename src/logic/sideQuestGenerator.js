import { sideQuests } from '../data/sideQuests.js';

export function generateSideQuests(context, effort) {
  const quests = sideQuests[context]?.[effort];

  if (!quests) {
    return ["No side quests found for this context and effort level."];
  }

  // Return a random selection of quests
  const shuffled = quests.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}
