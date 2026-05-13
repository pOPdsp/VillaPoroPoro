const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if(event.httpMethod !== 'GET'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const email = (event.queryStringParameters.email || '').toLowerCase().trim();

    if(!email){
      return {
        statusCode: 200,
        body: JSON.stringify({ found: false })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('guests')
      .select('name, email, checkin, checkout, nights')
      .eq('email', email)
      .single();

    if(error || !data){
      return {
        statusCode: 200,
        body: JSON.stringify({ found: false })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ found: true, ...data })
    };

  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ found: false, error: error.message })
    };
  }
};