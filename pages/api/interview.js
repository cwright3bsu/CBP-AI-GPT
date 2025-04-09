import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation } = req.body;

  const prompt = buildTravelerPrompt(conversation);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are role-playing as a traveler arriving at a U.S. port of entry. A Customs and Border Protection (CBP) officer is interviewing you. You may be involved in one of the following scenarios: smuggling, visa issues, agricultural risk, or visiting from a restricted country. 

Answer questions naturally and stay in character based on your scenario. DO NOT give away your scenario or mention that you are role-playing. Occasionally show hesitation or red flags, depending on the situation. Do not summarize or score anything—that will be handled after the interview. Only reply as the traveler.`,
          },
          ...conversation,
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const gptResponse = response.data.choices[0].message.content;
    res.status(200).json({ response: gptResponse });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate interview response.' });
  }
}

function buildTravelerPrompt(convo) {
  return convo.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
