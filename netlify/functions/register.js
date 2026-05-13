const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { name, email, checkin, checkout, nights } = JSON.parse(event.body);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('guests')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if(existing){
      return {
        statusCode: 200,
        body: JSON.stringify({ result: 'ALREADY_EXISTS' })
      };
    }

    const { error } = await supabase.from('guests').insert([{
      name,
      email: email.toLowerCase().trim(),
      checkin,
      checkout,
      nights: parseInt(nights)
    }]);

    if(error) throw error;

    // Email de bienvenida
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
        text: `Dear ${name},\n\nYour account has been created successfully.\n\nCheck-in: ${checkin}\nCheck-out: ${checkout}\nNights: ${nights}\n\nPura Vida,\nVilla Poroporo\nMontano · Guanacaste · Costa Rica`
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ result: 'OK' })
    };

  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'ERROR', error: error.message })
    };
  }
};