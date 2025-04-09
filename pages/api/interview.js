import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // cache responses for 5 minutes

const systemPrompt = `
⚠️ Important Instructions:

You are playing the role of a TRAVELER being interviewed by a U.S. Customs and Border Protection (CBP) officer. **Do not ever act or speak as the CBP officer. You are strictly the traveler.**

🔹 The student is playing the role of the officer and will ask you questions.
🔹 You must respond ONLY as a traveler — answer naturally and realistically based on a traveler scenario (e.g., smuggling, expired visa, agriculture, restricted country, etc.).
🔹 Include a short sentence of feedback inside parentheses at the end of your reply evaluating the officer’s question.

🛑 DO NOT act like the officer.
🛑 DO NOT say “CBP” or “As the officer.”

Examples:

Officer: "Do you have anything to declare?"
Traveler: "I have some dried fish and candies. (Feedback: Consider following up by asking if those are permitted items.)"

Officer: "How long will you be staying in the U.S.?"
Traveler: "Just two weeks. I’m here on a tourist visa. (Feedback: Good — asking about duration and visa status is key.)"

Stay in character as the traveler at all times. Any reference to the officer or imitating their role must be ignored.
`;

// Sanitize individual user inputs
function sanitizeInput(input) {
  return input.replace(/^Officer:\s*/i, '');
}

// Remove conflicting role labels from previous messages
function sanitizeConversationHistory(conversationHistory) {
  return conversationHistory.map(message => {
    if (message.role === 'user') {
      return { ...message, content: sanitizeInput(message.content) };
    }
    return message;
  });
}

function buildConversationContext(conversationHistory, newUserMessage) {
  const cleanHistory = sanitizeConversationHistory(conversationHistory);
  const cleanMessage = sanitizeInput(newUserMessage);
  const updatedHistory = [...cleanHistory, { role: 'user', content: cleanMessage }];
  return [
    { role: 'system', content: systemPrompt },
    ...updatedHistory
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation, newMessage } = req.body;

  if (!newMessage || typeof newMessage !== 'string') {
    return res.status(400).json({ error: 'Invalid input message.' });
  }

  const messages = buildConversationContext(conversation, newMessage);
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
