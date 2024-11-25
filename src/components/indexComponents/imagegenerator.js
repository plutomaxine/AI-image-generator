import React, { useState } from 'react';
import axios from 'axios';
import MyTextarea from './textarea.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './imagegenerator.css';

function ImageGenerator({ onImageGenerated, onPromptChange }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return; // Prevent sending if the prompt is empty

    onPromptChange(prompt);
    try {
      setLoading(true);
      const currentPrompt = prompt;
      setPrompt('');
      console.log(`Sending prompt to server: ${currentPrompt}`);

      const source = axios.CancelToken.source();
      const timeoutId = setTimeout(() => {
        source.cancel('Request timeout. Please try again.');
      }, 150000); // 15 seconds timeout

      const response = await axios.post('http://localhost:3002/generate-image', { prompt: currentPrompt }, { cancelToken: source.token });

      clearTimeout(timeoutId);

      if (response.status === 400) {
        const errorResponse = response.data;
        alert(errorResponse.error);
        setLoading(false);
        onImageGenerated([{ url: '', error: 'Request failed, please try again.' }]);
        return;
      }

      console.log(response.data);
      const imagesData = response.data.images;
      const safeImagesData = Array.isArray(imagesData) ? imagesData : [imagesData];
      onImageGenerated(safeImagesData);
    } catch (error) {
      console.error('Error generating image:', error);
      if (axios.isCancel(error)) {
        alert(error.message);
      } else if (error.response && error.response.status === 400) {
        alert(error.response.data.error);
      }
      onImageGenerated([{ url: '', error: 'Request failed, please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleGenerateImage();
    }
  };

  return (
    <div className="textarea">
      <MyTextarea 
        text={prompt}
        handleChange={(e) => setPrompt(e.target.value)}
        handleKeyPress={handleKeyPress}
      />
      <button className="send_btn" onClick={handleGenerateImage} disabled={!prompt.trim()}>
        <FontAwesomeIcon icon={faPaperPlane} size="lg" className="btn_icon" />
      </button>
    </div>
  );
}

export default ImageGenerator;
