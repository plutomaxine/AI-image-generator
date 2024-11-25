import React, { useState } from 'react';
import './textarea.css';

function MyTextarea({ text, handleChange, handleKeyPress }) {
  // const [text, setText] = useState('');
  const [textareaStyle, setTextareaStyle] = useState({height:'30px'});

  const handleTextChange = (event) => {
    // setText(event.target.value);
    handleChange(event); 
    const textarea = event.target;
    textarea.style.height = '30px';
    textarea.style.height = textarea.scrollHeight + 'px';
    // setTextareaStyle({height:'50px', height:event.target.scrollHeight + 'px'});
  };


  return (
    <textarea
      className="prompt_textarea"
      placeholder="Message Illusio..."
      value={text}
      onChange={handleTextChange}
      onKeyPress = {handleKeyPress}
      style={textareaStyle}

    />
  );
}

export default MyTextarea;
