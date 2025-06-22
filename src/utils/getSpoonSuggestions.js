export function getSpoonSuggestions(spoonCount = 0) {
    if (spoonCount <= 2) {
      return [
        "Close your eyes for a few minutes",
        "Sip some water or tea",
      ];
    } else if (spoonCount <= 5) {
      return [
        "Stretch gently or change your position",
        "Play a calming playlist or ambient noise",
      ];
    } else if (spoonCount <= 8) {
      return [
        "Make a snack or light meal",
        "Take your meds or check your to-do list",
      ];
    } else {
      return [
        "Step outside or open a window for air",
        "Organize one small thing—just one",
      ];
    }
  }
  