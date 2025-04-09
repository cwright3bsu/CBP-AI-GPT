import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation } = req.body;
  const prompt = generateScorePrompt(conversation);

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
         { role: "system", content: "You are a CBP interview simulator scoring module." },
         { role: "user", content: prompt }
      ],
      temperature: 0.5,
      stream: false
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const scoreResponse = response.data.choices[0].message.content;
    res.status(200).json({ score: scoreResponse });
  } catch (error) {
    console.error("Error scoring conversation", error);
    res.status(500).json({ error: 'Failed to score conversation' });
  }
}

function generateScorePrompt(conversation) {
  let prompt = "Please review the following CBP interview conversation and provide:\n";
  prompt += "1. A score (0 to 100) based on the effectiveness of the interviewer's questions and the interviewee's identification of red flags.\n";
  prompt += "2. Specific recommendations for improvement.\n\n";
  conversation.forEach((msg) => {
    prompt += `${msg.role}: ${msg.content}\n`;
  });
  return prompt;
}