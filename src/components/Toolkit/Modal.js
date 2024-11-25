import React, { useState, useRef } from 'react';
import Tabs from './Tabs.js';
import Upload from './Upload.js';
import Canvas from './Sketch.js';
import Album from './Album.js';
import Select from './Select.js';
import './Modal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

//Importing image files

const Modal = ({ onClose }) => {
  //Initiate a state to check the active tab. Initially, it is set to 'Album'
  const [activeTab, setActiveTab] = useState('Album');
  // Lift the state up to the Modal component
  const [files, setFiles] = useState([]);
  // Reference to the modal
  const modalRef = useRef();

  return (
      <div className="modal" ref={modalRef}>
        {/* Header contains the heading and the close icon */}
        <div className="modal-header">
          <span className="modal-title">Toolkit</span> {/* Header of the modal */}
          {/* Close icon in the modal */}
          <button onClick={onClose} className="close-modal-btn" style={{ border: 'none', background: 'transparent' }}>
            {/* <img src={closeButtonImage} alt="Close" style={{ width: '40px', height: '40px' }} /> */}
            <FontAwesomeIcon icon={faCircleXmark} size="lg" style={{color: "#53da3b"}}  />
          </button>
        </div>

        {/* Tabs in the modal */}
        {/* Set the current tab as the active tab */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="tab-content">
          {/* If the active tab is "Upload", then perfom activities in the Upload.js */}
          {activeTab === 'Upload' && <Upload files={files} setFiles={setFiles} setActiveTab={setActiveTab} />}
          {/* If the active tab is "Sketch", then perfom activities in the Sketch.js */}
          {activeTab === 'Sketch' && <Canvas files={files} setFiles={setFiles} />}
          {/* If the active tab is "Select", then perfom activities in the Sketch.js */}
          {activeTab === 'Select' && <Select files={files} setFiles={setFiles} />}
          {/* If the active tab is "Album", then perfom activities in the Album.js */}
          
          {activeTab === 'Album' && <Album />}
        </div>
      </div>
  );
};

export default Modal;