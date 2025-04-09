import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation } = req.body;

  const scorePrompt = `
You are evaluating a simulated CBP interview conducted by a student officer.

Analyze the following conversation where the officer (user) questions a traveler (assistant). Provide:

1. A score from 0–100 based on how well the officer identified red flags and asked relevant questions.
2. Specific feedback about what they did well and how they can improve.

Conversation:
${conversation.map((msg) => `${msg.role === 'user' ? 'Officer' : 'Traveler'}: ${msg.content}`).join('\n')}
`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a CBP interview scoring assistant.' },
        { role: 'user', content: scorePrompt }
      ],
      temperature: 0.5,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const score = response.data.choices[0].message.content;
    res.status(200).json({ score });
  } catch (error) {
    console.error('Scoring API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to score the conversation.' });
  }
}
