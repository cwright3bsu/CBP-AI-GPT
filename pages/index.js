import React from 'react';
import Interview from '../components/Interview';

export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        CBP GPT Interview Simulator
      </h1>
      <Interview />
    </div>
  );
}
