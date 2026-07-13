const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to check if logged in
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authorized' });
}

// GET /api/admin/registrations - get all members with their enrollments
router.get('/registrations', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*, enrollments(class_name)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/registrations/:id - update member status
router.patch('/registrations/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'contacted', 'confirmed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const { data, error } = await supabase
    .from('members')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/admin/registrations/:id - delete a registration
router.delete('/registrations/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  console.log('Deleting id:', id);

  const { error: enrollError } = await supabase.from('enrollments').delete().eq('member_id', id);
  console.log('Enroll delete error:', enrollError);

  const { error } = await supabase.from('members').delete().eq('id', id);
  console.log('Member delete error:', error);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;