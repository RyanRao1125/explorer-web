// ==========================================================================
// Explorer Robotics — Registration Form with Stripe Payment
// ==========================================================================

// IMPORTANT: use your TEST publishable key (pk_test_...) while building.
// Only switch to the live key (pk_live_...) when you are ready to accept real payments.
const stripe = Stripe('pk_live_51JAeyQJCgvsaNJe4rZ34h1etEBWNL2ZWq4rmwUfsWopkm6fzpipnDsgNESsW6MAkCG1toDIti4wKIZAfgk62elY700ieWmi9KL');
const elements = stripe.elements();

const elementStyle = {
  base: {
    fontFamily: "'Mulish', sans-serif",
    fontSize: '16px',
    color: '#161310',
    '::placeholder': { color: '#8a8578' }
  }
};

const cardNumberElement = elements.create('cardNumber', { style: elementStyle });
const cardExpiryElement = elements.create('cardExpiry', { style: elementStyle });
const cardCvcElement = elements.create('cardCvc', { style: elementStyle });

cardNumberElement.mount('#card-number-element');
cardExpiryElement.mount('#card-expiry-element');
cardCvcElement.mount('#card-cvc-element');

[cardNumberElement, cardExpiryElement, cardCvcElement].forEach(el => {
  el.on('change', (event) => {
    const displayError = document.getElementById('card_error');
    displayError.textContent = event.error ? event.error.message : '';
  });
});

const form = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const successMessage = document.getElementById('successMessage');

function showError(fieldId, message) {
  const el = document.getElementById(fieldId + '_error');
  if (el) el.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

function updatePaymentTotalDisplay() {
  const totalEl = document.getElementById('paymentTotalDisplay');
  if (totalEl) totalEl.textContent = `$${getCartTotal()}/month`;
}
document.addEventListener('DOMContentLoaded', updatePaymentTotalDisplay);

function validateForm(data) {
  let valid = true;

  if (!data.student_first_name) { showError('student_first_name', 'First name is required.'); valid = false; }
  if (!data.student_last_name) { showError('student_last_name', 'Last name is required.'); valid = false; }
  if (!data.birth_month || !data.birth_day || !data.birth_year) { showError('birth_date', 'Please select a complete birth date.'); valid = false; }
  if (!data.grade) { showError('grade', 'Please select a grade.'); valid = false; }
  if (!data.gender) { showError('gender', 'Please select a gender.'); valid = false; }
  if (!data.street_address) { showError('street_address', 'Street address is required.'); valid = false; }
  if (!data.city) { showError('city', 'City is required.'); valid = false; }
  if (!data.province) { showError('province', 'Province is required.'); valid = false; }
  if (!data.postal_code) { showError('postal_code', 'Postal code is required.'); valid = false; }
  if (!data.student_email) { showError('student_email', 'Student email is required.'); valid = false; }
  if (!data.parent_first_name) { showError('parent_first_name', 'Parent first name is required.'); valid = false; }
  if (!data.parent_last_name) { showError('parent_last_name', 'Parent last name is required.'); valid = false; }
  if (!data.parent_phone) { showError('parent_phone', 'Parent phone number is required.'); valid = false; }
  if (!data.parent_email) { showError('parent_email', 'Parent email is required.'); valid = false; }
  if (!data.emergency_first_name) { showError('emergency_first_name', 'Emergency contact first name is required.'); valid = false; }
  if (!data.emergency_last_name) { showError('emergency_last_name', 'Emergency contact last name is required.'); valid = false; }
  if (!data.emergency_relationship) { showError('emergency_relationship', 'Please select a relationship.'); valid = false; }
  if (!data.emergency_phone) { showError('emergency_phone', 'Emergency contact phone is required.'); valid = false; }
  if (!data.card_country) { showError('card_country', 'Please select your country.'); valid = false; }
  if (!data.card_postal) { showError('card_postal', 'Postal code is required.'); valid = false; }
  if (!data.signature) { showError('signature', 'Please type your full name to sign.'); valid = false; }
  if (!data.consent) { showError('consent', 'You must agree to the terms and conditions to register.'); valid = false; }

  const cart = getCart();
  if (cart.length === 0) {
    showError('card', 'Your cart is empty. Please add at least one class before registering.');
    valid = false;
  }

  if (!valid) {
    const firstError = document.querySelector('.field-error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = {
    student_first_name: form.student_first_name.value.trim(),
    student_last_name: form.student_last_name.value.trim(),
    birth_month: form.birth_month.value,
    birth_day: form.birth_day.value,
    birth_year: form.birth_year.value,
    grade: form.grade.value,
    gender: form.gender.value,
    street_address: form.street_address.value.trim(),
    street_address_2: form.street_address_2.value.trim(),
    city: form.city.value.trim(),
    province: form.province.value.trim(),
    postal_code: form.postal_code.value.trim(),
    student_email: form.student_email.value.trim(),
    parent_first_name: form.parent_first_name.value.trim(),
    parent_last_name: form.parent_last_name.value.trim(),
    parent_area_code: form.parent_area_code.value.trim(),
    parent_phone: form.parent_phone.value.trim(),
    parent_email: form.parent_email.value.trim(),
    emergency_first_name: form.emergency_first_name.value.trim(),
    emergency_last_name: form.emergency_last_name.value.trim(),
    emergency_relationship: form.emergency_relationship.value,
    emergency_area_code: form.emergency_area_code.value.trim(),
    emergency_phone: form.emergency_phone.value.trim(),
    card_country: form.card_country.value,
    card_postal: form.card_postal.value.trim(),
    signature: form.signature.value.trim(),
    consent: form.consent.checked
  };

  if (!validateForm(data)) return;

  submitBtn.disabled = true;
  submitText.textContent = 'Processing payment...';

  try {
    // 1. Create Stripe payment method from card details
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: `${data.parent_first_name} ${data.parent_last_name}`,
        email: data.parent_email,
        address: {
          country: data.card_country,
          postal_code: data.card_postal
        }
      }
    });

    if (pmError) {
      showError('card', pmError.message);
      submitText.textContent = 'Submit Registration';
      submitBtn.disabled = false;
      return;
    }

    // 2. Create the subscription on the backend
    const cart = getCart();
    const subRes = await fetch('http://localhost:3000/api/payment/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems: cart,
        email: data.parent_email,
        name: `${data.parent_first_name} ${data.parent_last_name}`,
        paymentMethodId: paymentMethod.id
      })
    });

    const subData = await subRes.json();

    if (!subRes.ok) {
      throw new Error(subData.error || 'Payment failed.');
    }

    // 3. Confirm the payment if needed (3D Secure etc.)
    if (subData.status === 'requires_action' || subData.status === 'requires_confirmation') {
      const { error: confirmError } = await stripe.confirmCardPayment(subData.clientSecret);
      if (confirmError) {
        showError('card', confirmError.message);
        submitText.textContent = 'Submit Registration';
        submitBtn.disabled = false;
        return;
      }
    }

    submitText.textContent = 'Saving registration...';

    // 4. Save the registration to Supabase, including cart + Stripe IDs
    const response = await fetch('http://localhost:3000/api/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        classes: cart,
        stripe_customer_id: subData.customerId,
        stripe_subscription_id: subData.subscriptionId
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Submission failed.');
    }

    clearCart();
    form.style.display = 'none';
    successMessage.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error(err);
    showError('card', err.message || 'Something went wrong. Please try again or contact us directly.');
    submitText.textContent = 'Submit Registration';
    submitBtn.disabled = false;
  }
});