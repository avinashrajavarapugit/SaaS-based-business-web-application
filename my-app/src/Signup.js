import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

function SignUp() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formSubmit = (data) => {
    setLoading(true);
    axios.post("api/signup/submit", data)
      .then(response => {
        if (response.status === 201) {
          navigate('/login');
        } else {
          setError(response.data.message);
        }
      })
      .catch(err => {
        if (err.response) {
          setError(err.response.data.message || "Error during signup");
        } else if (err.request) {
          setError("Network error, please try again.");
        } else {
          setError("Unexpected error occurred.");
        }
      })
      .finally(() => setLoading(false));
  }

  return (
    <form onSubmit={handleSubmit(formSubmit)} className='signup-form'>
      {error && <p className="error-message">{error}</p>}
      <div className='form-group'>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          {...register("username", { required: true })}
        />
        {errors.username && <p className="error-text">* Username is required</p>}
      </div>
      <div className='form-group'>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          {...register("email", { required: true })}
        />
        {errors.email && <p className="error-text">* Email is required</p>}
      </div>
      <div className='form-group'>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          {...register("password", { required: true })}
        />
        {errors.password && <p className="error-text">* Password is required</p>}
      </div>
      <div className='form-group'>
        <label htmlFor="confirmpassword">Confirm Password</label>
        <input
          type="password"
          id="confirmpassword"
          {...register("confirmpassword", { required: true })}
        />
        {errors.confirmpassword && <p className="error-text">* Confirm Password is required</p>}
      </div>
      <button
        type='submit'
        className='submit-btn'
        disabled={loading}
      >
        {loading ? 'Signing Up...' : 'Sign Up'}
      </button>
      <div className='login-redirect'>
        Already have an account?
        <Link to="/login">
          <button className='login-btn'>Login</button>
        </Link>
      </div>
    </form>
  );
}

export default SignUp;
