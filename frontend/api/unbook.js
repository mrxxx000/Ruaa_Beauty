const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token } = req.body || req.query || {};

  if (!token) {
    return res.status(400).json({ message: 'Cancel token is required' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // Find booking by cancel_token
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('cancel_token', token)
      .single();

    if (fetchError || !data) {
      console.error('Booking fetch error:', fetchError);
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ message: 'Error cancelling booking', details: deleteError.message });
    }

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        name: data.name,
        email: data.email,
        service: data.service,
        date: data.date,
      },
    });
  } catch (err) {
    console.error('Error processing cancellation:', err);
    return res.status(500).json({ message: 'Error processing cancellation', details: err.message });
  }
};
