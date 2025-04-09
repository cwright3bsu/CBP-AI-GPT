// pages/api/chat.js

import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // cache responses for 5 minutes

// Define the traveler profiles
const travelerProfiles = [
  {
    id: 'visa_issue',
    name: 'Visa Issue Traveler',
    description: 'You have an expired tourist visa. You are nervous and trying to hide your true travel intentions.',
    redFlags: ['expired visa'],
    additionalInfo: 'Be vague about the duration of your stay.'
  },
  {
    id: 'smuggling',
    name: 'Smuggling Traveler',
    description: 'You are carrying contraband goods. You try to be overly friendly while hiding evidence of the smuggled items.',
    redFlags: ['contraband goods', 'evading questions'],
    additionalInfo: 'Deflect questions about your belongings.'
  },
  {
    id: 'restricted_origin',
    name: 'Restricted Country Traveler',
    description: 'You come from a country with travel restrictions. You have a rushed and incomplete travel history.',
    redFlags: ['incomplete travel history', 'rushed manner'],
    additionalInfo: 'Try not to volunteer too many details about your origin.'
  },
  {
    id: 'terrorism',
    name: 'Suspicious Traveler',
    description: 'Your behavior and documents hint at possible involvement in suspicious activities. You keep your answers short and vague.',
    redFlags: ['inconsistent answers', 'document issues'],
    additionalInfo: 'Answer only what is absolutely necessary.'
  },
  {
    id: 'agricultural_goods',
    name: 'Agricultural Goods Traveler',
    description: 'You are carrying exotic fruits and vegetables that may not be allowed. You display nervousness when asked details about them.',
    redFlags: ['unusual items', 'hesitance'],
    additionalInfo: 'Avoid oversharing on your reason for carrying the goods.'
  },
  {
    id: 'insufficient_funds',
    name: 'Low Funds Traveler',
    description: 'You do not have enough funds to support your stay. You’re evasive about your financial situation.',
    redFlags: ['lack of funds', 'evasive responses'],
    additionalInfo: 'Keep your explanation vague and limited.'
  }
];

// Function to generate a dynamic system prompt based on the selected traveler profile.
function getSystemPrompt(profile) {
  return `
⚠️ Important Instructions:

You are playing the role of a TRAVELER with the following characteristics:

Profile: ${profile.name}
Description: ${profile.description}
Red Flags: ${profile.redFlags.join(', ')}

You are being interviewed by a U.S. Customs and Border Protection (CBP) officer (remember, you are NOT the officer).

🔹 The student (officer) will ask you questions.
🔹 Respond strictly as a traveler.
🔹 At the end of each reply, include a brief sentence of feedback (inside parentheses) evaluating how effective the officer’s question was.

🛑 DO NOT act as the officer.
🛑 DO NOT mention “CBP” or “as the officer.”

Examples:

Officer: "Do you have anything to declare?"
Traveler: "I have some items for personal use. (Feedback: The question is clear, but it might help to ask for specifics about those items.)"

Officer: "How long will you be staying in the U.S.?"
Traveler: "Two weeks. I’m visiting on a tourist visa. (Feedback: Good — inquiring about visa status is important.)"

Stay fully in character as the traveler.
  `;
}

// Utility function to sanitize a single input.
function sanitizeInput(input) {
  // Remove any leading "Officer:" (or similar) from the user's message
  return input.replace(/^Officer:\s*/i, '');
}

// Utility function to sanitize the conversation history.
function sanitizeConversationHistory(conversationHistory) {
  return conversationHistory.map(message => {
    if (message.role === 'user') {
      return { ...message, content: sanitizeInput(message.content) };
    }
    return message;
  });
}

// Build the full conversation context including the system prompt.
function buildConversationContext(conversationHistory, newUserMessage, profile) {
  const systemPrompt = getSystemPrompt(profile);
  const cleanHistory = sanitizeConversationHistory(conversationHistory);
  const cleanMessage = sanitizeInput(newUserMessage);
  const updatedHistory = [...cleanHistory, { role: 'user', content: cleanMessage }];
  return [
    { role: 'system', content: systemPrompt },
    ...updatedHistory
  ];
}

// Randomly select a traveler profile.
function selectRandomProfile() {
  const index = Math.floor(Math.random() * travelerProfiles.length);
  return travelerProfiles[index];
}

// API route handler.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation, newMessage, profileId } = req.body;

  if (!newMessage || typeof newMessage !== 'string') {
    return res.status(400).json({ error: 'Invalid input message.' });
  }

  // Select profile: if a profileId is provided, use it; otherwise pick one at random.
  const profile = profileId
    ? travelerProfiles.find(p => p.id === profileId) || selectRandomProfile()
    : selectRandomProfile();

  const messages = buildConversationContext(conversation || [], newMessage, profile);
  const cacheKey = JSON.stringify(messages);

  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    return res.status(200).json({ reply: cachedResponse });
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data.choices[0].message.content;
    cache.set(cacheKey, reply);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Something went wrong with the AI response.' });
  }
}
