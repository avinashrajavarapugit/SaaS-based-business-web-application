const express = require('express');
const router = express.Router();
const Contact = require('../src/Contact.js');

router.post('/submit', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Create new contact
    const contact = new Contact({
      name,
      email,
      message
    });

    // Save to database
    await contact.save();

    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully' 
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting contact form' 
    });
  }
});

module.exports = router;