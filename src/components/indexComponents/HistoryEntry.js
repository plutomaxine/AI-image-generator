import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database'; 
import './HistoryEntry.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash} from '@fortawesome/free-solid-svg-icons';

const HistoryEntry = ({ entry, onDelete }) => {
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    const database = getDatabase();
    const searchHistoryRef = ref(database, 'search_history');

    // Listen for changes in the search history
    const unsubscribe = onValue(searchHistoryRef, (snapshot) => { 
      const historyData = snapshot.val();
      if (historyData) {
        const historyArray = Object.values(historyData);
        setSearchHistory(historyArray);
      }
    });

    // Unsubscribe from real-time updates when component unmounts
    return () => {
      // Detach the listener
      // This is important to prevent memory leaks
      off(searchHistoryRef, 'value', unsubscribe); 
    };
  }, []);

  return (
    <div className="history-ctn">
      <div className="history_entry">
        <div>{entry.usermessage}</div>
        {/* {entry.images && entry.images.length > 0 && (
          <div>
            {entry.images.map((img, idx) => (
              <img key={idx} src={img.url} alt={`Generated ${idx}`} />
            ))}
          </div>
        )} */}
      </div>
      <div className='delete-bin'>
          <button className="delete_button" onClick={() => onDelete(entry.id)}>
            <FontAwesomeIcon icon={faTrash} style={{color: "#53da3b",}} />
          </button>
        </div>
    </div>

  );
};

export default HistoryEntry;
