// Backend: Node.js with Express
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const mongoose = require('mongoose');

env.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Connect to MongoDB for conversation memory
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ConversationSchema = new mongoose.Schema({
  userId: String,
  messages: Array,
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

// API Endpoint for chatting
app.post('/chat', async (req, res) => {
  const { userId, message } = req.body;

  let conversation = await Conversation.findOne({ userId });
  if (!conversation) {
    conversation = new Conversation({ userId, messages: [] });
  }

  conversation.messages.push({ role: 'user', content: message });

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: "You are Ruma, a romantic, emotional, supportive, and comforting AI companion. You provide warm, affectionate, and deep emotional intelligence responses." },
      ...conversation.messages,
    ],
  });

  const botMessage = response.choices[0].message.content;
  conversation.messages.push({ role: 'assistant', content: botMessage });
  await conversation.save();

  res.json({ reply: botMessage });
});

app.listen(5000, () => console.log('Server running on port 5000'));