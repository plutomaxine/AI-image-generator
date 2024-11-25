import React, { useState } from 'react';
import './aimessage.css';
import Popup from '../common/AlertPopup.js';

import logoIcon from '../../img/Logo_icon.png';
import userIcon from '../../img/User_alt_fill@3x.png';
import downloadIcon from '../../assets/images/download.png';

import { storage } from '../../config/firebase.js';
import { ref, uploadBytesResumable, getDownloadURL, updateMetadata } from 'firebase/storage';
import { generateShortId } from '../../Utils/Utils.js';

function AIMessage({ image, usermessage, loading }) {
  const [popupMessage, setPopupMessage] = useState(''); // State to set the message in the popup
  const [showPopup, setShowPopup] = useState(false); // State to show the popup

  const uploadImage = async (imageUrl, originalFileName) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const referenceId = generateShortId();
    const storageRef = ref(storage, `album/${referenceId}`);
    const metadata = {
      customMetadata: {
        'Original_File_Name': originalFileName,
        'REF_ID': referenceId,
      },
    };
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {},
        (error) => {
          console.error('Image upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            await updateMetadata(storageRef, metadata); // Ensure metadata is updated after upload
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Image uploaded successfully!', downloadURL, referenceId);
            resolve({ downloadURL, referenceId });
          } catch (metadataError) {
            reject(metadataError);
          }
        }
      );
    });
  };

  const handleUpload = async (img) => {
    try {
      const originalFileName = img.url.split('/').pop(); // Extract original file name from the URL
      const { downloadURL, referenceId } = await uploadImage(img.url, originalFileName);
      navigator.clipboard.writeText(referenceId); // Copy REF_ID to clipboard
      // setPopupMessage(`Image with REF_ID, '${referenceId}' has been added to the Album, and `);
      setPopupMessage(`Image added to Album. Reference ID '${referenceId}' copied to clipboard.`);
      setShowPopup(true); // Show the popup
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  return (
    <div className="chat_log">
      <div className="chat_message">
        <div className="user_info">
          <div className="avatar">
            <img src={userIcon} alt="User Avatar" className="avatar_img" />
          </div>
          <div className="user_name">User</div>
        </div>
        <div className="message">
          <p>{usermessage}</p>
        </div>
      </div>
      <div className="ai_chat_message">
        <div className="ai_info">
          <div className="avatar">
            <img src={logoIcon} alt="AI Avatar" className="avatar_img" />
          </div>
          <div className="ai_name">Illusio</div>
        </div>
        <div className="ai_message">
          {loading ? (
            <div className="loadingbox">
              <div className="loading-message"></div>
            </div>
          ) : (
            <>
              {image[0]?.error ? (
                <div className="error-message">{image[0].error}</div>
              ) : (
                image.map((img, index) => (
                  <div key={index} className="img_box">
                    <div className="img_wrapper">
                      <img
                        src={img.url}
                        alt="Generated Content"
                        className="img_box_preview"
                        style={{ width: '15em', height: '15em' }}
                      />
                      <a href={img.url} download className="download-icon">
                        <img src={downloadIcon} alt="Download" />
                      </a>
                    </div>
                    <button className="upload-btn btn-specific" onClick={() => handleUpload(img)}>Upload & Copy Code</button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
      {showPopup && <Popup message={popupMessage} onClose={handleClosePopup} />}
    </div>
  );
}

export default AIMessage;
