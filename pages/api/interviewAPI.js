import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation } = req.body;
  const prompt = generatePrompt(conversation);

  const cachedResponse = cache.get(prompt);
  if (cachedResponse) {
    return res.status(200).json({ response: cachedResponse });
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
         { role: "system", content: "You are a CBP interview simulator. Ask questions, identify red flags, and provide a final score with recommendations." },
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

    const gptResponse = response.data.choices[0].message.content;
    cache.set(prompt, gptResponse);

    res.status(200).json({ response: gptResponse });
  } catch (error) {
    console.error("Error calling GPT API", error);
    res.status(500).json({ error: 'Failed to process interview' });
  }
}

function generatePrompt(conversation) {
  let prompt = "You are conducting a simulated CBP interview. Use the following conversation:\n";
  conversation.forEach((msg) => {
    prompt += `${msg.role}: ${msg.content}\n`;
  });
  prompt += "\nNow, based on this conversation, ask the next relevant question and, if applicable, identify any red flags that need clarification.";
  return prompt;
}
