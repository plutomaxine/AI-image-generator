import React from 'react';
import './AlertPopup.css';
import closeIcon from '../../assets/images/Close.png';

const Popup = ({ message, onClose }) => {
  return (
    <div className="popup">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>
        <img src={closeIcon} alt="Close" style={{ width: '23px', height: '23px' }} />
        </button>
        <div className="popup-message">
          <p>{message}</p>
        </div>
        <button className="ok-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default Popup;
