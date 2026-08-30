import React, { useState } from 'react';

const AccountInformation = ({ user }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [billingAddress, setBillingAddress] = useState(user.billingAddress);

  const handleNameChange = event => {
    setName(event.target.value);
  };

  const handleEmailChange = event => {
    setEmail(event.target.value);
  };

  const handleBillingAddressChange = event => {
    setBillingAddress(event.target.value);
  };

  const handleSubmit = event => {
    event.preventDefault();
    // call a function to update the user's information in the database
  };

  return (
    <div>
      <h2>Account Information</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" value={name} onChange={handleNameChange} />
        </label>
        <label>
          Email:
          <input type="email" value={email} onChange={handleEmailChange} />
        </label>
        <label>
          Billing Address:
          <textarea value={billingAddress} onChange={handleBillingAddressChange} />
        </label>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default AccountInformation;
