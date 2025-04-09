import React, { useState } from 'react';
import axios from 'axios';
import ProgressIndicator from './ProgressIndicator';

const InterviewComponent = () => {
  const [conversation, setConversation] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('interview');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newConversation = [...conversation, { role: 'user', content: currentInput }];
    setConversation(newConversation);
    setCurrentInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/interviewAPI', { conversation: newConversation });
      setConversation([...newConversation, { role: 'agent', content: res.data.response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/score', { conversation });
      alert("Score and Recommendations:\n" + res.data.score);
      setPhase('completed');
    } catch (err) {
      console.error(err);
      alert("Error scoring conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProgressIndicator phase={phase} conversationLength={conversation.length} />
      <div style={{border: '1px solid #ccc', padding: '10px', minHeight: '200px'}}>
        {conversation.map((msg, idx) => (
          <p key={idx}><strong>{msg.role}:</strong> {msg.content}</p>
        ))}
        {loading && <p>Loading...</p>}
      </div>
      {phase === 'interview' && (
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            value={currentInput} 
            onChange={(e) => setCurrentInput(e.target.value)} 
            placeholder="Enter your response" 
            style={{width: '80%'}}
          />
          <button type="submit">Send</button>
          <button type="button" onClick={handleScore}>Finish Interview & Score</button>
        </form>
      )}
    </div>
  );
};

export default InterviewComponent;
