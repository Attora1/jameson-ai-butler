import React from "react";

function ChatContainer({ settings, children }) {
    const fontClass = `font-${settings.fontFamily || 'default'}`;
    const sizeClass = `size-${settings.fontSize || 'medium'}`;
  
    return (
      <div className={`chat-container ${fontClass} ${sizeClass}`}>
        {children}
      </div>
    );
  }
export default ChatContainer;  