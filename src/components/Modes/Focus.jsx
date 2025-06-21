import React, { useState, useEffect, useRef } from 'react';
import MotivQuote from '../MotivQuote';
import MusicToggle from '../Music.jsx';
import '../../styles/modes-css/Focus.css';

const Focus = ({ settings }) => {
  const [task, setTask] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const alertSound = useRef(new Audio('public/sounds/level-passed.mp3'));

  useEffect(() => {
    let timer;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      alertSound.current.play();
      setTimeout(() => {
        alert("Level complete — well done!");
      }, 100); // 100ms delay to let sound start playing
    }
    
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const startTimer = (minutes) => {
    setSecondsLeft(minutes * 60);
    setIsRunning(true);
  };

  const addChecklistItem = () => {
    if (newItem.trim()) {
      setChecklist([...checklist, { text: newItem, checked: false }]);
      setNewItem('');
    }
  };

  const toggleChecklistItem = (index) => {
    const updated = [...checklist];
    updated[index].checked = !updated[index].checked;
    setChecklist(updated);
  };

  return (
    <div className="focus-mode-container">
      <h3>🎯 Focus Mode</h3>

      <label>
        Task:
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What is the mission right now?"
          className="task-input"
        />
      </label>

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
          <button onClick={addChecklistItem} className="add-btn">
            Add
          </button>
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

      <div className="timer-controls">
        <button onClick={() => startTimer(10)} className="timer-btn">
          10 min
        </button>
        <button onClick={() => startTimer(20)} className="timer-btn">
          20 min
        </button>
        <button onClick={() => setIsRunning(false)} className="timer-btn stop-btn">
          Stop
        </button>
      </div>

      {isRunning && (
        <>
          <p className="timer-display">
            Time Left: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </p>
          <MotivQuote />
        </>
      )}

      {/* Fixed footer music toggle */}
      <footer className="focus-footer">
        <MusicToggle />
      </footer>
    </div>
  );
};

export default Focus;
