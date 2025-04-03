const express = require('express');
const axios = require('axios');
const { twiml } = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));

const VOICEFLOW_VERSION_ID = process.env.VOICEFLOW_VERSION_ID;
const API_KEY = process.env.VOICEFLOW_API_KEY;
const USER_ID = process.env.USER_ID || 'test-user';

const VF_URL = `https://general-runtime.voiceflow.com/state/${USER_ID}/interact`;

app.post('/voice', async (req, res) => {
  const userInput = req.body.SpeechResult || '';
  console.log(`User said: ${userInput}`);

  try {
    const vfRes = await axios.post(
      VF_URL,
      { type: 'text', payload: userInput },
      { headers: { Authorization: API_KEY } }
    );

    const responseText = vfRes.data[0]?.payload?.message || "Sorry, I didn't catch that.";

    const response = new twiml.VoiceResponse();
    response.say(responseText);
    response.redirect('/voice'); // keeps the convo going

    res.type('text/xml');
    res.send(response.toString());
  } catch (err) {
    console.error(err);
    const response = new twiml.VoiceResponse();
    response.say("There was an error. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});

app.get('/', (req, res) => res.send("Voiceflow Twilio Bot is Live."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
