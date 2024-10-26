import axios from 'axios';

export default async function handler(req, res) {
  const apiBaseUrl = "https://web-tech.tw/recv/openai/v1";
  const apiKey = process.env.AI_API_KEY;

  if (req.method === 'POST') {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/chat/completions`,
        {
          model: "gpt-4-turbo-preview",
          messages: req.body.messages,
          temperature: 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}