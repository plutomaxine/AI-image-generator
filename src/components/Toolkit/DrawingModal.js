import React, { useRef, useState, useEffect } from 'react';
import './DrawingModal.css';
import { storage } from '../../config/firebase.js';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { generateShortId } from '../../Utils/Utils.js';
import Popup from '../common/AlertPopup.js';
import axios from 'axios'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faBrush, faFile, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getDatabase, ref, push } from 'firebase/database';

const DrawingModal = ({ imageUrl, onClose, reloadAlbum }) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const offScreenCanvasRef = useRef(null);
  const sliderRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [color, setColor] = useState('#000000');
  const [previousNonEraserColor, setPreviousNonEraserColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(15);
  const [drawingTool, setDrawingTool] = useState('brush');
  const [showSlider, setShowSlider] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [tempFileRef, setTempFileRef] = useState(null);
  const [maskImageUrl, setMaskImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [initialImage, setInitialImage] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGeneratedImage, setShowGeneratedImage] = useState(false); // 新增状态以显示生成的图像

  useEffect(() => {
    if (canvasRef.current && originalCanvasRef.current && offScreenCanvasRef.current) {
      loadImage();
      window.addEventListener('resize', resizeCanvas);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [imageUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSlider && sliderRef.current && !sliderRef.current.contains(event.target)) {
        setShowSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlider]);

  const resizeCanvas = () => {
    if (canvasRef.current && originalCanvasRef.current && offScreenCanvasRef.current) {
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const offScreenCanvas = offScreenCanvasRef.current;
      const context = canvas.getContext('2d');
      const originalContext = originalCanvas.getContext('2d');
      const offScreenContext = offScreenCanvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const parentElement = canvas.parentElement;
        const { width: parentWidth, height: parentHeight } = parentElement.getBoundingClientRect();
        const { width: imgWidth, height: imgHeight } = img;

        const scale = Math.min(parentWidth / imgWidth, parentHeight / imgHeight);
        const newWidth = imgWidth * scale;
        const newHeight = imgHeight * scale;

        canvas.width = newWidth;
        canvas.height = newHeight;
        context.drawImage(img, 0, 0, newWidth, newHeight);

        originalCanvas.width = imgWidth;
        originalCanvas.height = imgHeight;
        offScreenCanvas.width = imgWidth;
        offScreenCanvas.height = imgHeight;

        originalContext.drawImage(img, 0, 0, imgWidth, imgHeight);
        offScreenContext.fillStyle = '#ffffff';
        offScreenContext.fillRect(0, 0, imgWidth, imgHeight);

        setInitialImage(context.getImageData(0, 0, newWidth, newHeight));
        saveCurrentState();
      };
    }
  };

  const loadImage = () => {
    resizeCanvas();
  };

  const toggleSlider = () => {
    setShowSlider(!showSlider);
  };

  const saveCurrentState = () => {
    if (canvasRef.current && originalCanvasRef.current && offScreenCanvasRef.current) {
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const offScreenCanvas = offScreenCanvasRef.current;
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      const originalImageData = originalCanvas.getContext('2d').getImageData(0, 0, originalCanvas.width, originalCanvas.height);
      const offScreenImageData = offScreenCanvas.getContext('2d').getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);
      setHistory([...history, { imageData, originalImageData, offScreenImageData }]);
    }
  };

  const undoLastAction = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const previousState = newHistory[newHistory.length - 1];
      const { imageData, originalImageData, offScreenImageData } = previousState;
      canvasRef.current.getContext('2d').putImageData(imageData, 0, 0);
      originalCanvasRef.current.getContext('2d').putImageData(originalImageData, 0, 0);
      offScreenCanvasRef.current.getContext('2d').putImageData(offScreenImageData, 0, 0);
      setHistory(newHistory);
    }
  };

  const getMousePosition = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (event) => {
    saveCurrentState();
    const { x, y } = getMousePosition(canvasRef.current, event);
    const context = canvasRef.current.getContext('2d');
    const originalContext = originalCanvasRef.current.getContext('2d');
    const offScreenContext = offScreenCanvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    originalContext.beginPath();
    originalContext.moveTo(x * (originalCanvasRef.current.width / canvasRef.current.width), y * (originalCanvasRef.current.height / canvasRef.current.height));
    offScreenContext.beginPath();
    offScreenContext.moveTo(x * (offScreenCanvasRef.current.width / canvasRef.current.width), y * (offScreenCanvasRef.current.height / canvasRef.current.height));
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const { x, y } = getMousePosition(canvasRef.current, event);
    const context = canvasRef.current.getContext('2d');
    const originalContext = originalCanvasRef.current.getContext('2d');
    const offScreenContext = offScreenCanvasRef.current.getContext('2d');

    const scaleWidth = originalCanvasRef.current.width / canvasRef.current.width;
    const scaleHeight = originalCanvasRef.current.height / canvasRef.current.height;
    const offScreenScaleWidth = offScreenCanvasRef.current.width / canvasRef.current.width;
    const offScreenScaleHeight = offScreenCanvasRef.current.height / canvasRef.current.height;

    if (drawingTool === 'brush') {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, lineWidth, 0, Math.PI * 2);
      context.fill();
      setHasContent(true);

      originalContext.fillStyle = color;
      originalContext.beginPath();
      originalContext.arc(x * scaleWidth, y * scaleHeight, lineWidth * scaleWidth, 0, Math.PI * 2);
      originalContext.fill();

      offScreenContext.fillStyle = '#000000';
      offScreenContext.beginPath();
      offScreenContext.arc(x * offScreenScaleWidth, y * offScreenScaleHeight, lineWidth * offScreenScaleWidth, 0, Math.PI * 2);
      offScreenContext.fill();
    }
  };

  const finishDrawing = () => {
    const context = canvasRef.current.getContext('2d');
    const originalContext = originalCanvasRef.current.getContext('2d');
    const offScreenContext = offScreenCanvasRef.current.getContext('2d');
    context.closePath();
    originalContext.closePath();
    offScreenContext.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current && originalCanvasRef.current && offScreenCanvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.putImageData(initialImage, 0, 0);

      const originalCanvas = originalCanvasRef.current;
      const originalContext = originalCanvas.getContext('2d');
      const offScreenCanvas = offScreenCanvasRef.current;
      const offScreenContext = offScreenCanvas.getContext('2d');

      originalContext.putImageData(originalContext.getImageData(0, 0, originalCanvas.width, originalCanvas.height), 0, 0);
      offScreenContext.fillStyle = '#ffffff';
      offScreenContext.fillRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);

      setHasContent(false);
      setHistory([]);
    }
  };

  const switchTool = (tool) => {
    if (drawingTool !== tool) {
      saveCurrentState();
    }
    setDrawingTool(tool);
  };

  const handleColorChange = (event) => {
    setColor(event.target.value);
    if (drawingTool !== 'eraser') {
      setPreviousNonEraserColor(event.target.value);
    }
  };

  const generateMask = () => {
    const offScreenCanvas = offScreenCanvasRef.current;
    const maskContext = offScreenCanvas.getContext('2d');

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = offScreenCanvas.width;
    maskCanvas.height = offScreenCanvas.height;
    const maskCanvasContext = maskCanvas.getContext('2d');

    maskCanvasContext.fillStyle = '#ffffff';
    maskCanvasContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    maskCanvasContext.drawImage(offScreenCanvas, 0, 0);

    return maskCanvas.toDataURL('image/png');
  };

  const uploadImage = async (imageDataURL) => {
    try {
      const shortId = generateShortId();
      const metadata = {
        customMetadata: {
          'REF_ID': shortId,
          'Original_File_Name': shortId + '.jpeg'
        }
      };

      const imageBlob = await fetch(imageDataURL).then(res => res.blob());
      const imageRef = storageRef(storage, `album/${shortId}`);
      await uploadBytes(imageRef, imageBlob, metadata);
      const downloadURL = await getDownloadURL(imageRef);
      return { success: true, downloadURL, shortId };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { success: false, message: error.message };
    }
  };

  const uploadMask = async (maskDataURL) => {
    try {
      const shortId = generateShortId();
      const metadata = {
        customMetadata: {
          'REF_ID': shortId,
          'Original_File_Name': shortId + '.jpeg'
        }
      };

      const maskBlob = await fetch(maskDataURL).then(res => res.blob());
      const maskRef = storageRef(storage, `album/${shortId}`);
      await uploadBytes(maskRef, maskBlob, metadata);
      const downloadURL = await getDownloadURL(maskRef);
      setTempFileRef(maskRef);
      return { success: true, downloadURL };
    } catch (error) {
      console.error("Error uploading mask:", error);
      return { success: false, message: error.message };
    }
  };

  const removeMaskImage = async (maskImageUrl) => {
    const fileRef = storageRef(storage, maskImageUrl);
    try {
      await deleteObject(fileRef);
      console.log('Mask image successfully removed.');
    } catch (error) {
      console.error("Error removing mask image: ", error);
    }
  };

  const handleExit = async () => {
    clearCanvas();
    if (tempFileRef) {
      try {
        await deleteObject(tempFileRef);
        console.log("Temporary file deleted successfully");
      } catch (error) {
        console.error("Error deleting temporary file:", error);
      }
    }
    onClose();
  };

  const handlePopupClose = () => {
    setUploadSuccess(false);
    setPopupMessage('');
    setShowGeneratedImage(true); 
    reloadAlbum(); 
  };

  const generateImage = async (maskImageUrl) => {
    console.log('Initial Image URL:', imageUrl);
    console.log('Mask Image URL:', maskImageUrl);
    console.log('Prompt:', prompt);
    if (!imageUrl) {
      console.error('Initial image URL is required.');
      return;
    }

    if (!maskImageUrl) {
      console.error('Mask image URL is required.');
      return;
    }

    if (!prompt) {
      console.error('Prompt is required.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3002/api/generate-image', {
        init_image_url: imageUrl,
        prompt: prompt,
        mask_image_url: maskImageUrl
      });
      console.log('Image generation successful:', response.data);
      setGeneratedImageUrl(response.data.image);

      const uploadResponse = await uploadImage(response.data.image);
      if (uploadResponse.success) {
        console.log("Generated image uploaded successfully!");
        navigator.clipboard.writeText(uploadResponse.shortId); // Copy REF_ID to clipboard
        setPopupMessage(`Image added to Album. Reference ID '${uploadResponse.shortId}' copied to clipboard.`);
        setUploadSuccess(true);
        await removeMaskImage(maskImageUrl);
      } else {
        console.error("Failed to upload generated image:", uploadResponse.message);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const maskDataURL = generateMask();
    const response = await uploadMask(maskDataURL);
    if (response.success) {
      setMaskImageUrl(response.downloadURL);

      // Store the prompt in Firebase Realtime Database
      const database = getDatabase();
      const promptRef = ref(database, 'search_history');
      push(promptRef, {
        prompt: prompt
      });

      await generateImage(response.downloadURL);
    } else {
      console.error("Failed to upload mask:", response.message);
    }
  };

  return (
    <div className="drawing-modal-content">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
      <div className="tool-selector">
        <div className='undo-clear'>
          <button className='undo-btn sketch-btn' onClick={undoLastAction}>
            <FontAwesomeIcon icon={faArrowRotateLeft} />
            <span className="icon-text">Undo</span>
          </button>
          <button className='clear-btn sketch-btn' onClick={clearCanvas}>
            <FontAwesomeIcon icon={faFile} />
            <span className="icon-text">Clear</span>
          </button>
        </div>
        <div className="slider-container">
          <input type="color" value={color} onChange={handleColorChange} />
          <button className="adjust-button" onClick={toggleSlider}>
            <span className="icon-text">⚫️</span>
          </button>
          {showSlider && (
            <div ref={sliderRef} className="slider-popup">
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={e => setLineWidth(e.target.value)}
                className="range-slider"
              />
            </div>
          )}
          <button className={`brush-btn sketch-btn ${activeTool === 'brush' ? 'active' : ''}`}
            onClick={() => {
              switchTool('brush');
              setActiveTool('brush');
            }}>
            <FontAwesomeIcon icon={faBrush} />
            <span className="icon-text">Brush</span>
          </button>
        </div>
        <div className="exit-buttons">
          <button className="exit-btn sketch-btn" onClick={handleExit}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>
      <div className="drawing-modal-canvas">
        {showGeneratedImage && generatedImageUrl ? (
          <div className="generated-image-container">
            <img src={generatedImageUrl} alt="Generated" className="generated-image" />
            <button className="close-btn" onClick={onClose}></button>
          </div>
        ) : (
          <>
            <canvas
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseOut={finishDrawing}
              ref={canvasRef}
            />

            <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
            <canvas ref={offScreenCanvasRef} style={{ display: 'none' }} />
          </>
        )}
      </div>
      <div className="drawing-modal-input">
        <input
          type="text"
          placeholder="Enter your prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="prompt-input"
        />
        <button onClick={handleGenerateImage} className="generate-image-btn" disabled={!prompt.trim()}>
          Generate Image
        </button>
        {uploadSuccess && (
          <Popup
            message={popupMessage}
            onClose={handlePopupClose}
          />
        )}
      </div>
    </div>
  );
};

export default DrawingModal;
