import React, { useState, useEffect, useRef } from 'react';
import MotivQuote from '../MotivQuote';
import MusicToggle from '../Music.jsx';
import generateSideQuests from '../genSideQuests';
import '../../styles/modes-css/Focus.css';

const Focus = ({ settings }) => {
  const [task, setTask] = useState('');
  const [taskSubmitted, setTaskSubmitted] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const alertSound = useRef(new Audio('/sounds/ding2.mp3'));

  // Timer effect
  useEffect(() => {
    let timer;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      alertSound.current.play();
      alert("Level complete — well done!");
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  // Side quests
  useEffect(() => {
    if (task.trim()) {
      const generated = generateSideQuests(task);
      setSuggestions(generated);
    } else {
      setSuggestions([]);
    }
  }, [task]);

  // Timer Controls
  const startTimer = (minutes) => {
    setSecondsLeft(minutes * 60);
    setIsRunning(true);
  };

  const toggleChecklistItem = (index) => {
    const updated = [...checklist];
    updated[index].checked = !updated[index].checked;
    setChecklist(updated);
  };

  const addChecklistItem = () => {
    if (newItem.trim()) {
      setChecklist([...checklist, { text: newItem, checked: false }]);
      setNewItem('');
    }
  };

  return (
    <div className="focus-wrapper">
      {/* Left Panel: Task & Checklist */}
      <div className="focus-panel">
        <h3>🎯 Focus Mode</h3>

        {!taskSubmitted ? (
          <label>
            Task:
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && task.trim()) {
                  setTaskSubmitted(true);
                  e.preventDefault();
                }
              }}
              placeholder="What is the mission right now?"
              className="task-input"
            />
          </label>
        ) : (
          <>
            <h3 className="task-header">{task}</h3>
            <button className="add-btn" onClick={() => setTaskSubmitted(false)}>Edit Task</button>
          </>
        )}

        <label>
          Checklist:
          <div className="checklist-input">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a side-quest"
              className="new-item-input"
            />
            <button onClick={addChecklistItem} className="add-btn">Add</button>
          </div>
        </label>

        <ul className="checklist">
          {checklist.map((item, index) => (
            <li key={index} className={item.checked ? 'checked' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleChecklistItem(index)}
                />
                {item.text}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Panel: Side Quests & Timer */}
      <div className="focus-panel">
        <div className="side-quest-section">
          <h4>🗂️ Optional Side Quests</h4>
          <ul className="suggestion-list">
            {suggestions.map((idea, idx) => (
              <li key={idx}>• {idea}</li>
            ))}
          </ul>
        </div>

        <div className="timer-controls">
          <button onClick={() => startTimer(10)} className="timer-btn">10 min</button>
          <button onClick={() => startTimer(20)} className="timer-btn">20 min</button>
          <button onClick={() => setIsRunning(!isRunning)} className="timer-btn">
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => {
            setIsRunning(false);
            setSecondsLeft(0);
          }} className="timer-btn stop-btn">
            Stop
          </button>
        </div>

        {secondsLeft > 0 && (
          <p className="timer-display">
            Time Left: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
        )}

        <MotivQuote />
        <MusicToggle />
      </div>
    </div>
  );
};

export default Focus;
