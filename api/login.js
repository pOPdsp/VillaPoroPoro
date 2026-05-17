const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if(req.method !== 'GET'){
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const email = (req.query.email || '').toLowerCase().trim();

    if(!email){
      return res.status(200).json({ found: false });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('guests')
      .select('name, email, checkin, checkout, nights')
      .eq('email', email)
      .maybeSingle();

    if(error || !data){
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({ found: true, ...data });

  } catch(error) {
    console.error('Login error:', error);
    return res.status(500).json({ found: false, error: error.message });
  }
};