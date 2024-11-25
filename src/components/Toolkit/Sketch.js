import React, { useRef, useState, useEffect } from 'react';
import './Sketch.css';
import Popup from '../common/AlertPopup.js';

import { storage } from '../../config/firebase.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateShortId } from '../../Utils/Utils.js'; //Import the function to generate a short ID
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faPen, faBrush, faEraser} from '@fortawesome/free-solid-svg-icons';


const Canvas = () => {
    const canvasRef = useRef(null); // Reference to the canvas element
    const sliderRef = useRef(null); // Reference to the slider element

    const [isDrawing, setIsDrawing] = useState(false); // State to manage drawing status
    const [history, setHistory] = useState([]); // History for undo functionality
    const [color, setColor] = useState('#000000'); // Currently selected color
    const [previousNonEraserColor, setPreviousNonEraserColor] = useState('#000000'); // Last color before using eraser
    const [lineWidth, setLineWidth] = useState(5); // Line width for drawing tools
    const [drawingTool, setDrawingTool] = useState('pen'); // Currently selected drawing tool
    const [showSlider, setShowSlider] = useState(false); // State to toggle slider visibility

    const [hasContent, setHasContent] = useState(false); // Track if the canvas has content
    const [popupMessage, setPopupMessage] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false); // State to check if the upload was successful
    const [originalFileName, setOriginalFileName] = useState(''); // To display the original file name
    const [activeTool, setActiveTool] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = 750;
        canvas.height = 400;
        context.fillStyle = '#fff'; // Set initial canvas background to white
        context.fillRect(0, 0, canvas.width, canvas.height);
        saveCurrentState(); // Save the initial state in history
    }, []);

    // Close the slider when clicking outside
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

    const toggleSlider = () => {
        setShowSlider(!showSlider);  // Toggle slider display
    };

    const saveCurrentState = () => {
        const canvas = canvasRef.current;
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        setHistory([...history, imageData]); // Save current canvas state to history
    };

    const undoLastAction = () => {
        if (history.length > 1) { // Ensure there is always an initial state
            const newHistory = history.slice(0, -1);
            const previousState = newHistory[newHistory.length - 1];
            canvasRef.current.getContext('2d').putImageData(previousState, 0, 0);
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
        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (event) => {
        if (!isDrawing) return;
        const { x, y } = getMousePosition(canvasRef.current, event);
        const context = canvasRef.current.getContext('2d');
        if (drawingTool === 'pen' || drawingTool === 'brush') {
            context.lineTo(x, y);
            context.strokeStyle = color;
            context.lineWidth = drawingTool === 'pen' ? lineWidth : lineWidth * 2; // Adjust line width based on tool
            context.stroke();
            setHasContent(true); // Mark canvas as having content
        } else if (drawingTool === 'eraser') {
            context.lineTo(x, y);
            context.strokeStyle = '#ffffff'; // Set stroke color for eraser to white
            context.lineWidth = lineWidth;
            context.stroke();
        }
    };

    const finishDrawing = () => {
        const context = canvasRef.current.getContext('2d');
        context.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = 750;
        canvas.height = 450;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff'; // Reset the canvas background after clearing
        context.fillRect(0, 0, canvas.width, canvas.height);
        setHasContent(false); // Mark canvas as not having content
        setHistory([]); // Clear the history after clearing the canvas
    };

    const switchTool = (tool) => {
        if (drawingTool !== tool) {
            saveCurrentState();
        }
        if (tool === 'eraser') {
            setColor('#ffffff'); // Use white color for eraser
        } else {
            setColor(previousNonEraserColor); // Restore previous color when switching back from eraser
        }
        setDrawingTool(tool);
    };

    const handleColorChange = (event) => {
        setColor(event.target.value);
        if (drawingTool !== 'eraser') {  // Update the color only if the current tool is not eraser
            setPreviousNonEraserColor(event.target.value);
        }
    };

    // Sketch upload
    const handleUpload = async () => {
        const canvas = canvasRef.current;
        canvas.toBlob(async (blob) => {
            const shortId = generateShortId();
            const originalFileName = shortId + '.jpeg';

            const metadata = {
                customMetadata: {
                    'REF_ID': shortId,
                    'Original_File_Name': originalFileName
                }
            };
            
            const imageRef = storageRef(storage, `album/${shortId}`);
            try {
                await uploadBytes(imageRef, blob, metadata);
                const downloadURL = await getDownloadURL(imageRef);
                console.log(`Image uploaded successfully: ${downloadURL}`);
                navigator.clipboard.writeText(shortId); // Copy the REF_ID to the clipboard
                // setPopupMessage(`Your sketch, '${originalFileName}', has been added to the Album, and the REF_ID copied to your clipboard for reference.`);
                setPopupMessage(`Sketch added to Album. Reference ID '${shortId}' copied to clipboard.`);
                setUploadSuccess(true);
            } catch (error) {
                console.error("Upload failed:", error);
                setUploadSuccess(false);
            }
        }, 'image/jpeg');
    };

    // Popup close handler
    const handleClosePopupAndClearCanvas = () => {
        setUploadSuccess(false); // Reset upload success state
        setPopupMessage(false); // Close the popup
        clearCanvas(); // Clear the canvas
    };

    const handleToolClick = (tool) => {
        setActiveTool(tool);
    }

    return (
        <div className="sketch-container">
            <div className="tool-selector">           
                <div className="slider-container">
                    <input type="color" value={color} onChange={handleColorChange} />
                    <button className="adjust-button" onClick={() => setShowSlider(!showSlider)} >
                        <span className="icon-text">⚫️</span></button>
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

                    <button className= {`pen-btn sketch-btn ${activeTool === 'pen' ? 'active' : ''}`} 
                        onClick={() => {
                            switchTool('pen');
                            setActiveTool('pen');
                        }}>
                        <FontAwesomeIcon icon={faPen} />
                        <span className="icon-text">Pen</span></button>
                    <button className={`brush-btn sketch-btn ${activeTool === 'brush' ? 'active' : ''}`} 
                        onClick={() => {
                            switchTool('brush');
                            setActiveTool('brush');
                        }}>
                        <FontAwesomeIcon icon={faBrush}/>
                        <span className="icon-text">Brush</span></button>
                    <button className={`eraser-btn sketch-btn ${activeTool === 'eraser' ? 'active' : ''}`} 
                        onClick={() => {
                            switchTool('eraser');
                            setActiveTool('eraser');
                            }}>
                        <FontAwesomeIcon icon={faEraser} />
                        <span className="icon-text">Eraser</span>
                    </button>
                    {/* <button className='clear-btn' onClick={clearCanvas}>Clear Canvas</button> */}
                </div>
                <button className='undo-btn sketch-btn' onClick={undoLastAction}>
                <FontAwesomeIcon icon={faArrowRotateLeft}/>
                <span className="icon-text">Undo</span></button>                
            </div>
            <canvas
                className='canvas-sketch'
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseOut={finishDrawing}
                ref={canvasRef}
                width={750}
                height={400}
            />

            <div className="buttons-container">
                <button
                    className={`proceed-btn ${hasContent ? 'active' : ''}`}
                    onClick={handleUpload}
                    disabled={!hasContent}>
                    Upload
                </button>

                <button className="cancel-btn" onClick={clearCanvas}>Clear</button>
            </div>

            {uploadSuccess && (
                <Popup
                    message={popupMessage}
                    onClose={handleClosePopupAndClearCanvas}
                />
            )}
        </div>
    );
};
export default Canvas;
