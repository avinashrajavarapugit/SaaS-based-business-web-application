import React from 'react';
import './RequestDemo.css';

function RequestDemo() {
  return (
    <div className="request-demo">
      <h2>Request a Demo</h2>
      <form>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" required />
        </div>
        
        <div className="form-group">
          <label htmlFor="company">Company:</label>
          <input type="text" id="company" name="company" required />
        </div>
        <div className="form-group">
          <label htmlFor="CompanySize">CompanySize: </label>
          <input id="CompanySize" name="ComapanySize" required />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default RequestDemo;
