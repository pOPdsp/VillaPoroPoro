const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, checkin, checkout, nights } = req.body;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: existing } = await supabase
      .from('guests')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if(existing){
      return res.status(200).json({ result: 'ALREADY_EXISTS' });
    }

    const { error } = await supabase.from('guests').insert([{
      name,
      email: email.toLowerCase().trim(),
      checkin,
      checkout,
      nights: parseInt(nights)
    }]);

    if(error) throw error;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Villa Poroporo <onboarding@resend.dev>',
        to: email,
        subject: '🌿 Welcome to Villa Poroporo',
        text: `Dear ${name},\n\nYour account has been created successfully.\n\nCheck-in: ${checkin}\nCheck-out: ${checkout}\nNights: ${nights}\n\nPura Vida,\nVilla Poroporo\nBagaces · Guanacaste · Costa Rica`
      })
    });

    return res.status(200).json({ result: 'OK' });

  } catch(error) {
    console.error('Register error:', error);
    return res.status(500).json({ result: 'ERROR', error: error.message });
  }
};