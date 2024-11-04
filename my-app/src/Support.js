import React, { useState } from 'react';
import './Support.css';
import axios from 'axios';
// import { getFirestore } from 'firebase/firestore';

const Support = () => {
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
    // const db = getFirestore();
    try {
      const response = await axios.post('/api/support/submit', formData);
      // console.log(response.data)
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        setError('Something went wrong. Please try again.');
        // console.log(response)
      }
      // const docRef = await db.collection('support').add({
      //   name,
      //   email,
      //   message,
      // });
      // console.log('Document written with ID: ', docRef.id);
      
    } catch (error) {
      console.error('Error adding document: ', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }finally {
      setLoading(false);
    }
  };

  return (
    <div className="n">
      <div className="support-page-header">
        <h1>Support</h1>
        <p>If you need help, you've come to the right place.</p>
      </div>
      <div className="support-page-content">
        <h2>Common Questions</h2>
        <p>Here are some of our most frequently asked questions.</p>
        <ul>
          <li>
            <span>How do I create an account?</span>
            <span className="answer">To create an account, simply click on the "Sign Up" button in the top right corner of the page and follow the instructions.</span>
          </li>
          <li>
            <span>How do I reset my password?</span>
            <span className="answer">To reset your password, click on the "Forgot Password" link on the login page and follow the instructions.</span>
          </li>
          <li>
            <span>How do I contact support?</span>
            <span className="answer">To contact support, click on the "Contact Us" link in the footer and fill out the form.</span>
          </li>
        </ul>
      </div>
      <div className="support-page-sidebar">
        <h2>Still Need Help?</h2>
        <p>Fill out the form below to contact support.</p>
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
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit"> {loading ? 'Submitting...' : 'Submit'}</button>
        </form>
      )}
      </div>
      
    </div>
  );
};

export default Support;
