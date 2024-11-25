
import React, { useState, useEffect } from 'react';
import Modal from './components/Toolkit/Modal.js';
import './App.css';
import './normal.css';
import ImageGenerator from './components/indexComponents/imagegenerator.js';
import AIMessage from './components/indexComponents/aimessage.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import logo from './img/Logo.png';
import { getDatabase, ref, push, onValue, remove } from 'firebase/database';
import CollapsibleChatHistory from './components/indexComponents/collapsibleChatHistory.js';

function App() {
  // Toolkit pop-up start
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // ChatHistory start
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);

  // Fetch initial prompt history from Firebase
  useEffect(() => {
    const database = getDatabase();
    const promptRef = ref(database, 'search_history');

    onValue(promptRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.keys(data).map(key => ({
          id: key,
          usermessage: data[key].prompt,
          images: [], // Adjust this if you have images in your stored data
          loading: false
        }));
        setChatHistory(historyArray);
      }
    });
  }, []);

  const addNewChatSession = () => {
    console.log("Clearing current chat"); // Debugging line
    setCurrentChat([]); // Clears only the display area
  };

  const handlePromptChange = (newPrompt) => {
    const newEntry = { id: Date.now().toString(), usermessage: newPrompt, images: [], loading: true };

    console.log("Adding new prompt:", newPrompt);

    // Append to the chat history for logging
    setChatHistory(prevHistory => [...prevHistory, newEntry]);

    // Append to the current chat to maintain the flow of conversation
    setCurrentChat(prevChat => [...prevChat, newEntry]);

    // Save the new prompt to Firebase Realtime Database
    const database = getDatabase();
    const promptRef = ref(database, 'search_history');
    push(promptRef, { prompt: newPrompt });
  };

  // Update the images for the last entry in the chat
  const handleImageGenerated = (imagesData) => {
    console.log("Images generated:", imagesData);

    setCurrentChat(prevChat => {
      const newChat = [...prevChat];
      const lastEntry = newChat[newChat.length - 1];
      lastEntry.images = imagesData;
      lastEntry.loading = false;
      return newChat;
    });

    setChatHistory(prevHistory => {
      const newHistory = [...prevHistory];
      const lastEntry = newHistory[newHistory.length - 1];
      lastEntry.images = imagesData;
      lastEntry.loading = false;
      return newHistory;
    });
  };

  // Delete a prompt from the prompt   history
  const handleDeletePrompt = (id) => {
    console.log("Deleting prompt with id:", id);
    
    // Remove from state
    setChatHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
    
    // Remove from Firebase
    const database = getDatabase();
    const promptRef = ref(database, `search_history/${id}`);
    remove(promptRef).catch(error => console.error("Error removing prompt:", error));
  };

  return (
    <div className="app h-full flex">
      <CollapsibleChatHistory chatHistory={chatHistory} onAddNewSession={addNewChatSession} onDeletePrompt={handleDeletePrompt} />
      <div className='chat_body flex flex-col'>
        <div className="header">
          <img src={logo} alt='logo' style={{ width: '120px', marginRight: '10px' }} />
        </div>
        <div className="div_whole">
          <div className="div_chat">
            {currentChat.map((entry) => (
              <AIMessage
                key={entry.id}
                image={entry.images}
                usermessage={entry.usermessage}
                loading={entry.loading}
              />
            ))}
          </div>
          <div className="input_text_frame">
            <div className="input_text_box">
              <button onClick={toggleModal} className="open-modal-btn">
                <FontAwesomeIcon icon={faBox} className="btn_icon" size="xl" />
              </button>
              {isModalOpen && (
                <div className="overlay">
                  <Modal onClose={toggleModal} />
                </div>
              )}
              <ImageGenerator onImageGenerated={handleImageGenerated} onPromptChange={handlePromptChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
