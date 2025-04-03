const express = require('express');
const axios = require('axios');
const { twiml } = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));

const VOICEFLOW_VERSION_ID = process.env.VOICEFLOW_VERSION_ID;
const API_KEY = process.env.VOICEFLOW_API_KEY;

app.post('/voice', async (req, res) => {
  const userInput = req.body.SpeechResult?.trim() || '';
  const USER_ID = req.body?.From?.replace('+', '') || 'demo-user-1';

  console.log(`User said: ${userInput}`);
  console.log(`Caller number: ${req.body?.From}`);
  console.log(`Using USER_ID: ${USER_ID}`);
  console.log(`VOICEFLOW_VERSION_ID: ${VOICEFLOW_VERSION_ID}`);

  const VF_URL = `https://general-runtime.voiceflow.com/state/${VOICEFLOW_VERSION_ID}/user/${USER_ID}/interact`;

  const response = new twiml.VoiceResponse();

  // If Twilio didn't capture any speech
  if (!userInput) {
    console.log("No speech detected. Repeating prompt with fallback message.");

    const gather = response.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST',
      speechTimeout: 'auto'
    });

    gather.say("I'm sorry, I didn’t catch that. Could you please say that again?");
    response.redirect('/voice');

    res.type('text/xml');
    return res.send(response.toString());
  }

  try {
    const vfRes = await axios.post(
      VF_URL,
      { type: 'text', payload: userInput },
      { headers: { Authorization: API_KEY } }
    );

    const responseText = vfRes.data[0]?.payload?.message || "Sorry, I didn't catch that.";
    console.log(`Voiceflow response: ${responseText}`);

    const gather = response.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST',
      speechTimeout: 'auto'
    });

    gather.say(responseText);
    response.redirect('/voice');

    res.type('text/xml');
    res.send(response.toString());
  } catch (err) {
    console.error('Error talking to Voiceflow:', err.message);

    response.say("There was an error. Please try again later.");
    res.type('text/xml');
    res.send(response.toString());
  }
});

app.get('/', (req, res) => res.send("Voiceflow Twilio Bot is Live."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
