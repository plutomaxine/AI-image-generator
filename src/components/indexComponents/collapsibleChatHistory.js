

import React, { useState } from 'react';
import './collapsibleChatHistory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquarePlus, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import HistoryEntry from './HistoryEntry.js';
import { Expand_left } from './icon.js';

const CollapsibleChatHistory = ({ chatHistory, onAddNewSession, onDeletePrompt }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="chat_history_wrapper">
      <aside className={`chat_history ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="history_head">
          <span className="head_text">Prompt History</span>
          <button className="head_icon" onClick={onAddNewSession}>
            <FontAwesomeIcon icon={faSquarePlus} size="2xl" className="btn_icon"/>
          </button>
        </div>
        <div className="history_content">
          {chatHistory.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} onDelete={onDeletePrompt} />
          ))}
        </div>
      </aside>

      <div className="control_bar">
        <button
          className="control_bar_icon"
          onClick={toggleCollapse}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isHovered ? (
            isCollapsed ? (
              <FontAwesomeIcon icon={faAngleRight} size="xl" style={{ color: "#53da3b" }} />
            ) : (
              <FontAwesomeIcon icon={faAngleLeft} size="xl" style={{ color: "#53da3b" }} />
            )
          ) : (
            <Expand_left />
          )}
        </button>
      </div>
    </div>
  );
};

export default CollapsibleChatHistory;
