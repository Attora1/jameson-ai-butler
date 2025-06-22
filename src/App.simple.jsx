import { useState, useEffect } from 'react';

function App() {
  // Local storage for preferences
  const [userPrefers, setUserPrefers] = useState(() => {
    const saved = localStorage.getItem('jamesonPrefs');
    return saved ? JSON.parse(saved) : { hates_cold: true };
  });

  // Proactive alerts
  useEffect(() => {
    const checkTasks = () => {
      const tasks = [
        { name: "Hoodie Check", due: Date.now() + 30*60000, urgency: 5 }
      ];
      
      tasks.forEach(task => {
        if (task.due - Date.now() < 25*60000) {
          alert(`Jameson: ${task.name} requires attention.`);
        }
      });
    };
    
    checkTasks();
    const interval = setInterval(checkTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      {/* Your existing UI code */}
    </div>
  );
}

export default App;
