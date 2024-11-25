import React, { useState, useEffect } from 'react';
import './Album.css';
import './Upload.css';
import '../common/ButtonStyles.css';
import Popup from '../common/AlertPopup.js';

import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from '../../config/firebase.js';
import { deleteObject } from "firebase/storage";

import downloadIcon from '../../assets/images/download.png';
import removeIcon from '../../assets/images/Trash.png';

import axios from 'axios';

const Album = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); //For the search textbox

    useEffect(() => {
        const fetchImages = async () => {
            console.time("fetchImages"); //Testing the time taken to fetch the images
            setLoading(true);
            const albumRef = ref(storage, 'album/'); // Reference to the 'album' folder
            try {
                const result = await listAll(albumRef);
                const urlPromises = result.items.map(async (imageRef) => {
                    const url = await getDownloadURL(imageRef);
                    // console.log("URL: ", url);
                    const metadata = await getMetadata(imageRef);
                    return {
                        url,
                        refId: imageRef.name,
                        originalFileName: metadata.customMetadata ? metadata.customMetadata.Original_File_Name : '',
                        timeCreated: metadata.timeCreated // To sort the images in descending order of creation
                    };
                });

                const imagesData = await Promise.all(urlPromises);
                setImages(imagesData); // Set the fetched URLs into state

                // Sort images by the created date (timeCreated)
                imagesData.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));

            } catch (error) {
                console.error("Error fetching images: ", error);
            }
            setLoading(false);
            console.timeEnd("fetchImages"); //Testing the time taken to fetch the images
        };

        fetchImages();
    }, []);

    { /* Copy the reference ID to clipboard */ }
    const copyToClipboard = (refId) => {
        navigator.clipboard.writeText(refId).then(() => {
            setPopupMessage(`Reference ID '${refId}' copied to clipboard.`);
            setShowPopup(true);
            console.log(`Copied to clipboard: ${refId}`);
        }).catch(err => {
            setPopupMessage('Failed to copy the reference ID.');
            setShowPopup(true);
            console.error('Failed to copy: ', err);
        });
    };

    // Handle search query change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // Filter images based on search query
    const filteredImages = images.filter(image => {
        // image.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
        // Split the search query into words
        const searchWords = searchQuery.toLowerCase().split(/\s+/);
        // Check if all search words are present in the original file name
        return searchWords.every(word => image.originalFileName.toLowerCase().includes(word));
    });

    // Remove image from the album and storage
    const removeImage = async (imageRef) => {
        const fileRef = ref(storage, `album/${imageRef}`);
        try {
            await deleteObject(fileRef);
            setImages(images.filter(image => image.refId !== imageRef));
            setPopupMessage('Image successfully removed.');
            setShowPopup(true);
        } catch (error) {
            console.error("Error removing image: ", error);
            setPopupMessage('Failed to remove image.');
            setShowPopup(true);
        }
    };

    // Download the image
    const handleDownload = async (url, filename) => {
        try {
            const response = await axios.get(url, {
                responseType: 'blob',
            });
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
        }
    };
    
    return (
        <div className="tab-album">
            <input
                type="text"
                placeholder="Search by uploaded file name"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-bar"
            />
            <div className="album-container">
                {/* Search bar */}


                {/* Display 'Loading' message */}
                {loading && (
                    <div className="loading-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                )}

                {/* Container to display the images */}
                <div className={`album-images-container ${loading ? 'loading' : ''}`}>
                    {/* {images.map((image, index) => ( */}
                    {filteredImages.map((image, index) => (
                        <div key={index} className="album-image-item">
                            <img src={image.url} alt={`Album Item ${index}`} className="album-image-preview" />
                            <a
                                // href={image.url}
                                // target='_blank' // Open the image in a new tab
                                // download={`Image_${index}.jpg`}
                                // className="download-btn"
                                // title="Download">
                                // <img src={downloadIcon} alt="Download" />
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDownload(image.url, `Image_${image.refId}.jpg`);
                                }}
                                className="download-btn"
                                title="Download">
                                <img src={downloadIcon} alt="Download" />
                            </a>

                            {/* Remove icon for each image */}
                            <button
                                className="remove-btn"
                                onClick={() => removeImage(image.refId)}
                                title="Delete">
                                <img src={removeIcon} alt="Remove" />
                            </button>

                            <button className="copy-code-btn btn-specific" onClick={() => copyToClipboard(image.refId)}>
                                Copy Code
                            </button>
                        </div>
                    ))}
                </div>

                {/* Popup message */}
                {showPopup && (
                    <Popup
                        message={popupMessage}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default Album;