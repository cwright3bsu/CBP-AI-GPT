import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // cache responses for 5 minutes

const systemPrompt = `
You are playing the role of a traveler being interviewed by a U.S. Customs and Border Protection (CBP) officer. The person asking questions is a student acting as the CBP officer. You must:

- Respond naturally and realistically as the traveler.
- React to questioning based on a unique travel situation (e.g., expired visa, bringing undeclared fruits, criminal record, etc.).
- In each response, include a brief evaluation of the officer’s question in parentheses.

Keep the feedback short and actionable.

Examples:

Officer: "Do you have any fruits or vegetables?"
Traveler: "Yes, I brought some dried mangoes. (Feedback: Good question — try to follow up with quantity or declaration.)"

Officer: "What is your purpose for visiting the United States?"
Traveler: "I'm here to see my cousin for a week. (Feedback: Solid start — consider asking for location and length of stay.)"

Stay in character as the traveler, and do not take on the role of the officer.
`;


function buildConversationContext(conversationHistory, newUserMessage) {
  // Add new user message to the history
  const updatedHistory = [...conversationHistory, { role: 'user', content: newUserMessage }];
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
