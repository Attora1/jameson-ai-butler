export function shouldPlacate({ messages, placations, hasPlacated, teaCooldown }) {
    if (messages.length === 0) return false;
  
    const lastMessage = messages[messages.length - 1];
  
    // Don’t placate if Jameson just did
    if (placations.includes(lastMessage.text)) return false;
  
    if (lastMessage.isUser && lastMessage.text.length < 20 && !hasPlacated && !teaCooldown) {
      return true;
    }
  
    return false;
  }
  