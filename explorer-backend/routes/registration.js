const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/', async (req, res) => {
  const {
    student_first_name,
    student_last_name,
    birth_month,
    birth_day,
    birth_year,
    grade,
    gender,
    street_address,
    street_address_2,
    city,
    province,
    postal_code,
    student_email,
    parent_first_name,
    parent_last_name,
    parent_area_code,
    parent_phone,
    parent_email,
    emergency_first_name,
    emergency_last_name,
    emergency_relationship,
    emergency_area_code,
    emergency_phone,
    referred_first_name,
    referred_last_name,
    referred_area_code,
    referred_phone,
    signature,
    consent
  } = req.body;

  // Required field validation
  if (
    !student_first_name || !student_last_name ||
    !birth_month || !birth_day || !birth_year ||
    !grade || !gender ||
    !street_address || !student_email ||
    !parent_first_name || !parent_last_name ||
    !parent_phone || !parent_email ||
    !emergency_first_name || !emergency_last_name ||
    !emergency_relationship || !emergency_phone ||
    !signature || !consent
  ) {
    return res.status(400).json({ error: 'All required fields must be filled in.' });
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert([{
      student_first_name,
      student_last_name,
      birth_month,
      birth_day,
      birth_year,
      grade,
      gender,
      street_address,
      street_address_2: street_address_2 || null,
      city,
      province,
      postal_code,
      student_email,
      parent_first_name,
      parent_last_name,
      parent_area_code: parent_area_code || null,
      parent_phone,
      parent_email,
      emergency_first_name,
      emergency_last_name,
      emergency_relationship,
      emergency_area_code: emergency_area_code || null,
      emergency_phone,
      referred_first_name: referred_first_name || null,
      referred_last_name: referred_last_name || null,
      referred_area_code: referred_area_code || null,
      referred_phone: referred_phone || null,
      signature,
      consent: consent === true || consent === 'true',
      status: 'pending'
    }])
    .select()
    .single();

  if (memberError) {
    console.error(memberError);
    return res.status(500).json({ error: 'Failed to save registration.' });
  }

  res.status(201).json({ message: 'Registration successful!', member_id: member.id });
});

module.exports = router;