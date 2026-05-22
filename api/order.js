const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, checkin, checkout, nights, items, total } = req.body;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if(existing){
      await supabase.from('orders')
        .update({
          items,
          total: parseFloat(total),
          status: 'Pending',
          created_at: new Date().toISOString()
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
          `Our team will contact you shortly.\n\n` +
          `Pura Vida,\nVilla Poroporo\nBagaces · Guanacaste · Costa Rica`
      })
    });

    return res.status(200).json({ result: 'OK' });

  } catch(error) {
    console.error('Order error:', error);
    return res.status(500).json({ result: 'ERROR', error: error.message });
  }
};