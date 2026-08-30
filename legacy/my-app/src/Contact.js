import React, { useState } from 'react';
import axios from 'axios';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/contact/submit', formData);
      // console.log(response)
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='contact-us-container'>
      <h1 className='jkl'>Contact Us</h1>
      
      {error && (
        <div className='error-message'>
          {error}
        </div>
      )}

      {submitted ? (
        <div className='thank-you-message'>
          <p>Thank you for contacting us!</p>
          <p>We will get back to you as soon as possible.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='contact-form'>
          <div className='input-group'>
            <label htmlFor='name'>Name:</label>
            <input
              type='text'
              id='name'
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className='input-group'>
            <label htmlFor='email'>Email:</label>
            <input
              type='email'
              id='email'
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className='input-group'>
            <label htmlFor='message'>Message:</label>
            <textarea
              id='message'
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button 
            type='submit' 
            className='submit-button'
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Contact;