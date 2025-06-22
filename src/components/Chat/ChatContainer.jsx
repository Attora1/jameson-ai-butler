import React from "react";

function ChatContainer({ settings, children }) {
    // Make sure your settings.fontFamily and fontSize values match the class suffixes
    const fontClass = `font-${settings.fontFamily || 'default'}`;
    const sizeClass = `size-${settings.fontSize || 'medium'}`;
  
    return (
      <div className={`chat-container ${fontClass} ${sizeClass}`}>
        {children}
      </div>
    );
  }
export default ChatContainer;  