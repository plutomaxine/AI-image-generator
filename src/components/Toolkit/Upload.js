import React, { useCallback, useState } from 'react';
import './Upload.css';
// import '../common/ButtonStyles.css';
import Popup from '../common/AlertPopup.js';

//Importing image files
import closeIcon from '../../assets/images/Remove_image.png';

//Importing firebase storage functions
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../../config/firebase.js';
import { generateShortId } from '../../Utils/Utils.js'; //Import the function to generate a short ID
import {Upload_button} from '../indexComponents/icon.js'

//Define the Upload component
//files: Need to keep the array of images retain when moving between tabs
//setFiles: Update the state of the files array
const Upload = ({ files, setFiles, setActiveTab }) => {
  const [showPopup, setShowPopup] = useState(false); //State to show the popup
  const [popupMessage, setPopupMessage] = useState(''); //State to set the message in the popup
  const [uploadSuccess, setUploadSuccess] = useState(false); //State to check if the upload was successful
  const [uploading, setUploading] = useState(false);

  //Upload the images to the Firebase storage
  const handleUpload = async () => {
    console.time("uploadImage"); //Testing the time taken to upload the images
    setUploading(true);

    try {
      // Upload all files in parallel
      await Promise.all(files.map(async (file) => {
        const shortId = generateShortId();
        const storageRef = ref(storage, `album/${shortId}`); // Reference to the 'album' folder
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'REF_ID': shortId, //Store reference ID under metadata
            'Original_File_Name': file.name //Store original file name under metadata
          }
        };

        // Upload the file and get download URL
        await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(storageRef);
        console.log(`File uploaded: ${downloadURL}`);
      }));

      // If all uploads succeed
      setPopupMessage('Success! Images have been uploaded and are now available in the album.');
      setUploadSuccess(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      // If any upload fails
      setPopupMessage('Error uploading files. Please try again.');
      setUploadSuccess(false);
    } finally {
      setUploading(false);
      setShowPopup(true);
      setFiles([]);
      console.timeEnd("uploadImage"); //Testing the time taken to upload the images
    }
  };

  //Check the file size
  const checkFileSize = (file) => {
    if (file.size > 5242880) { // 5 MB in bytes
      setPopupMessage('One or more files are too large. Please upload files less than 5MB.');
      setShowPopup(true);
      return false;
    }
    return true;
  };

  //Drag functionality
  const onDrop = useCallback((event) => {
    //Prevent the default behavior of the browser and allow the drop
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files).filter(checkFileSize); //Check the file size

    const imageFiles = newFiles.filter((file) =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
    );

    //Check if the total number of images is more than 4
    if (files.length + imageFiles.length > 4) {
      setPopupMessage('You can only upload a maximum of 4 images.');
      setShowPopup(true);
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...imageFiles]);
  }, [files, setFiles]);

  //Drag functionality
  const onDragOver = (event) => {
    //Prevent the default behavior of the browser and allow the drop
    event.preventDefault();
  };

  //Open the file upload dialog
  const openFileDialog = () => {
    document.getElementById('fileInput').click();
  };

  //Update the state with the files selected from the file dialog
  const onFileChange = (event) => {
    const filesFromInput = Array.from(event.target.files).filter(checkFileSize); //Check the file size

    //Check if the total number of images is more than 4
    if (files.length + filesFromInput.length > 4) {
      setPopupMessage('You can only upload a maximum of 4 images.');
      setShowPopup(true);
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...filesFromInput]);
  };

  //Remove the image from the state and UI will no longer display the removed image
  const removeImage = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="upload-container">
      {uploading && (
        <div className="loading-spinner">
          <p>Upload is in progress. Please wait...</p>
          {/* You can customize the loading spinner as needed */}
        </div>
      )}

      {!uploading && (
        <>
          {/* Drag and drop area */}
          <div
            className="drop-area"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={openFileDialog}
          >
            <div className="drag-drop-message">
              <p>Drag and drop images here (jpeg, jpg, png)<br />
              (maximum 4 files, less than 5MB each allowed)</p>
              <span className="upload-link">Upload</span>
            </div>
            {/* Trigger the "Upload" button functionality */}
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={onFileChange}
              accept="image/jpeg, image/png, image/jpg"
              style={{ display: 'none' }}
              data-testid="fileInput" //for unit testing
            />
          </div>

          {/* Container for displaying preview images */}
          <div className="images-preview">
            {/* Iterate through the 'files' array that contains the uploaded images */}
            {/* For each image, a container (image-container) will be created with an index*/}
            {/* Each image will get a temporary URL(URL.createObjectURL(file) to display it in the container */}
            {/* 'Close' icon will also appear for each image */}
            {files.map((file, index) => (
              <div className="image-container" key={index}>
                <img src={URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  className="image-preview"
                  onLoad={() => URL.revokeObjectURL(file)} />

                <button className="close-image-btn" title="Remove image" onClick={() => removeImage(index)}>
                  <img src={closeIcon} alt="Close" />
                </button>
              </div>
            ))}
          </div>

          <div className="buttons-container">
            <button
              className={`proceed-btn ${files.length > 0 ? 'active' : ''}`}
              disabled={files.length === 0}
              onClick={handleUpload}>
              Confirm
            </button>
            <button className="cancel-btn" onClick={() => setFiles([])}>Clear</button>
          </div>

          {/* Show popup messages */}
          {showPopup && (
            <Popup
              message={popupMessage}
              onClose={() => {
                setShowPopup(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

      export default Upload;