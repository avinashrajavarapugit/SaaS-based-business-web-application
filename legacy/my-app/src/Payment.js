import React, { useState } from 'react';
import './Payment.css';
import Stripe from 'stripe';

const stripe = new Stripe('xxx');

const PaymentPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { token } = await stripe.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expiry.split('/')[0],
          exp_year: expiry.split('/')[1],
          cvc: cvc,
        },
      });
      // Send the token to your server to process the payment
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="payment-page">
      <h1>Payment Page</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name on Card:
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <br />
        <label>
          Email:
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <br />
        <label>
          Card Number:
          <input type="text" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
        </label>
        <br />
        <label>
          Expiry (MM/YY):
          <input type="text" value={expiry} onChange={(event) => setExpiry(event.target.value)} />
        </label>
        <br />
        <label>
          CVC:
          <input type="text" value={cvc} onChange={(event) => setCvc(event.target.value)} />
        </label>
        <br />
        <button type="submit">Submit Payment</button>
      </form>
    </div>
  );
};

export default PaymentPage;


