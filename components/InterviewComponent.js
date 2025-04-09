import React, { useState } from 'react';
import axios from 'axios';
import ProgressIndicator from './ProgressIndicator';

const InterviewComponent = () => {
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('interview'); // or 'completed'

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const updatedConversation = [...conversation, { role: 'user', content: input }];
    setConversation(updatedConversation);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/interviewAPI', { conversation: updatedConversation });
      const reply = res.data.response;
      setConversation([...updatedConversation, { role: 'assistant', content: reply }]);
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
      alert("Score & Feedback:\n\n" + res.data.score);
      setPhase('completed');
    } catch (err) {
      console.error(err);
      alert("Error scoring conversation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans">
      <h1 className="text-xl font-bold mb-4">CBP GPT Interview Simulator</h1>

      <ProgressIndicator phase={phase} count={conversation.length} />

      <div className="border rounded p-3 h-96 overflow-y-auto bg-gray-50 mb-3">
        {conversation.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-blue-700' : 'text-black'}`}>
            <strong>{msg.role === 'user' ? 'Officer' : 'Traveler'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <p><em>Generating response...</em></p>}
      </div>

      {phase === 'interview' && (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="border p-2 flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your next question..."
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
          <button type="button" onClick={handleScore} className="bg-green-600 text-white px-4 py-2 rounded">Finish</button>
        </form>
      )}
    </div>
  );
};

export default InterviewComponent;
