import React, { useState } from 'react';

const Otp = () => {
  const [otp, setOtp] = useState('');

  const handleOtpChange = (event) => {
    setOtp(event.target.value);
  };

  const handleVerifyOtp = () => {
    // handle OTP verification logic here
  };

  return (
    <div className="otp-page">
      <form>
        <h1>Enter the OTP sent to your email</h1>
        <div className="otp-inputs">
          <input type="text" maxLength="1" value={otp.charAt(0)} onChange={handleOtpChange} />
          <input type="text" maxLength="1" value={otp.charAt(1)} onChange={handleOtpChange} />
          <input type="text" maxLength="1" value={otp.charAt(2)} onChange={handleOtpChange} />
          <input type="text" maxLength="1" value={otp.charAt(3)} onChange={handleOtpChange} />
        </div>
        <button type="button" onClick={handleVerifyOtp}>Verify OTP</button>
        <p className="otp-resend">Didn't receive the OTP? <a href="#">Resend</a></p>
      </form>
    </div>
  );
};

export default Otp;
