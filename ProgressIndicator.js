import React from 'react';

const ProgressIndicator = ({ phase, conversationLength }) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      <p>Phase: {phase === 'interview' ? 'Interview in Progress' : 'Interview Completed'}</p>
      <p>Number of exchanges: {conversationLength}</p>
    </div>
  );
};

export default ProgressIndicator;