import React, { useState, useEffect } from 'react';
import './Album.css'; 
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from '../../config/firebase.js';
import DrawingModal from './DrawingModal.js'; 

const Select = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // For the search textbox
  const [isDrawing, setIsDrawing] = useState(false); // State to control the drawing modal
  const [selectedImage, setSelectedImage] = useState(''); // State to store the selected image URL

  const loadAlbumImages = async () => {
    console.time("fetchImages"); // Testing the time taken to fetch the images
    setLoading(true);
    const albumRef = ref(storage, 'album/'); // Reference to the 'album' folder
    try {
      const result = await listAll(albumRef);
      const urlPromises = result.items.map(async (imageRef) => {
        const url = await getDownloadURL(imageRef);
        const metadata = await getMetadata(imageRef);
        console.log("URL:", url);
        console.log("Ref ID:", imageRef.name);
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
    console.timeEnd("fetchImages"); // Testing the time taken to fetch the images
  };

  useEffect(() => {
    loadAlbumImages();
  }, []);

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter images based on search query
  const filteredImages = images.filter(image => {
    // Split the search query into words
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    // Check if all search words are present in the original file name
    return searchWords.every(word => image.originalFileName?.toLowerCase().includes(word));
  });

  // Open drawing modal and set selected image
  const openDrawingModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsDrawing(true); // 
  };

  // Close drawing modal
  const closeDrawingModal = () => {
    setIsDrawing(false);
    setSelectedImage('');
  };

  return (
    <div className='tab-album'>
    {/* Search bar */}
      <div className="album-container">
        {!isDrawing ? (
          <>

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
              {filteredImages.map((image, index) => (
                  <div key={index} className="album-image-item">
                    <img src={image.url} alt={`Album Item ${index}`} className="album-image-preview" />
                    {/* Modify button */}
                    <button className="copy-code-btn btn-specific" onClick={() => openDrawingModal(image.url)}>
                      Modify
                    </button>
                  </div>
              ))}
            </div>
          </>
        ) : (
          <DrawingModal onClose={closeDrawingModal} imageUrl={selectedImage} reloadAlbum={loadAlbumImages} />
        )}
      </div>
    </div>
  );
};

export default Select;
