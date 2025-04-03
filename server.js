app.post('/voice', async (req, res) => {
  const userInput = req.body.SpeechResult?.trim() || '';
  const USER_ID = req.body?.From?.replace('+', '') || 'demo-user-1';

  console.log(`User said: ${userInput}`);
  console.log(`Caller number: ${req.body?.From}`);
  console.log(`Using USER_ID: ${USER_ID}`);
  console.log(`VOICEFLOW_VERSION_ID: ${VOICEFLOW_VERSION_ID}`);

  const VF_URL = `https://general-runtime.voiceflow.com/state/${VOICEFLOW_VERSION_ID}/user/${USER_ID}/interact`;

  const response = new twiml.VoiceResponse();

  // 🔄 If no speech input, offer a fallback response
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
