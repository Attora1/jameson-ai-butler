const generateSideQuests = (task) => {
    if (!task.trim()) return [];
  
    const suggestions = [];
  
    // Basic keyword matching for demo
    if (task.toLowerCase().includes('email')) {
      suggestions.push('Draft email');
      suggestions.push('Review recipients');
      suggestions.push('Schedule send time');
    } 
    if (task.toLowerCase().includes('code')) {
      suggestions.push('Write tests');
      suggestions.push('Review PR');
      suggestions.push('Document changes');
    } 
    if (task.toLowerCase().includes('meeting')) {
      suggestions.push('Prepare agenda');
      suggestions.push('Send invite');
      suggestions.push('Review notes');
    }
  
    // Default fallback suggestions
    if (suggestions.length === 0) {
      suggestions.push('Break into steps');
      suggestions.push('Prep materials');
      suggestions.push('Set a 10-min chunk');
      suggestions.push('Ask for help');
    }
  
    return suggestions;
  };
  export default generateSideQuests;
