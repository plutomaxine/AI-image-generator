

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faPhotoVideo, faPencilAlt, faMousePointer } from '@fortawesome/free-solid-svg-icons';
import './Tabs.css';

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <ul className="tabs">
      <li className={activeTab === 'Album' ? 'active' : ''} onClick={() => setActiveTab('Album')}>
        <FontAwesomeIcon icon={faPhotoVideo} className="tab-icon" />
        <span> Album</span>
      </li>
      <li className={activeTab === 'Upload' ? 'active' : ''} onClick={() => setActiveTab('Upload')}>
        <FontAwesomeIcon icon={faUpload} className="tab-icon" />
        <span> Upload</span>
      </li>
      <li className={activeTab === 'Sketch' ? 'active' : ''} onClick={() => setActiveTab('Sketch')}>
        <FontAwesomeIcon icon={faPencilAlt} className="tab-icon" />
        <span> Sketch</span>
      </li>
      <li className={activeTab === 'Select' ? 'active' : ''} onClick={() => setActiveTab('Select')}>
        <FontAwesomeIcon icon={faMousePointer} className="tab-icon" />
        <span> Select</span>
      </li>
    </ul>
  );
};

export default Tabs;
