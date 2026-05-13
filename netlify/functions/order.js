const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { name, email, checkin, checkout, nights, items, total } = JSON.parse(event.body);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Buscar si el huésped ya tiene una orden y actualizar, si no crear nueva
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if(existing){
      await supabase.from('orders')
        .update({
          items,
          total: parseFloat(total),
          status: 'Pending',
          created_at: new Date()
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('orders').insert([{
        name,
        email: email.toLowerCase().trim(),
        checkin,
        checkout,
        nights: parseInt(nights),
        items,
        total: parseFloat(total),
        status: 'Pending'
      }]);
    }

    // Email de confirmación al cliente
    const numberedList = items.split('|')
      .map((item, i) => `${i+1}. ${item.trim()}`)
      .join('\n');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Villa Poroporo <onboarding@resend.dev>',
        to: email,
        subject: '🌿 Villa Poroporo — Order Received · Pending Confirmation',
        text:
          `Dear ${name},\n\n` +
          `Thank you for your order at Villa Poroporo!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `YOUR ORDER — PENDING CONFIRMATION\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `${numberedList}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `TOTAL: $${total}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Check-in:  ${checkin}\n` +
          `Check-out: ${checkout}\n` +
          `Nights:    ${nights}\n\n` +
          `Our team will contact you shortly to confirm everything.\n\n` +
          `Pura Vida,\nVilla Poroporo\nMontano · Guanacaste · Costa Rica`
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