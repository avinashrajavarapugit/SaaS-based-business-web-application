import React, { useState } from 'react';
import './Login.css';
import { useForm } from 'react-hook-form';
import { FaMicrosoft, FaFacebook, FaGoogle } from 'react-icons/fa';
import axios from 'axios';

const Login = () => {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Function to handle login
  const handleLogin = async (userCredObj) => {
    try {
      const response = await axios.post('/api/login/submit', userCredObj);
      if (response.data.success) {
        setSuccessMessage("Thanks for logging in!");
        setError("");
      } else {
        setError(response.data.message || "Login failed.");
        setSuccessMessage("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect to the server.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="login-page">
      {error && (
        <p className="display-3 text-danger text-center">{error}</p>
      )}
      {successMessage && (
        <p className="display-3 text-success text-center">{successMessage}</p>
      )}
      <form onSubmit={handleSubmit(handleLogin)}>
        <h1>Login</h1>
        <label htmlFor="v1">Username</label>
        <input
          type="text"
          id="v1"
          {...register("username", { required: true })}
        />
        {errors.username && <p className="text-danger">*Username is required</p>}

        <label htmlFor="v2">Password</label>
        <input
          type="password"
          id="v2"
          {...register("password", { required: true })}
        />
        {errors.password && <p className="text-danger">*Password is required</p>}

        <button type="submit">Login</button>
        <button type="button">Forgot Password?</button>

        <div className="oauth-providers">
          <button type="button">
            <FaMicrosoft style={{ marginRight: '8px' }} /> Login with Microsoft
          </button>
          <button type="button">
            <FaFacebook style={{ marginRight: '8px' }} /> Login with Facebook
          </button>
          <button type="button">
            <FaGoogle style={{ marginRight: '8px' }} /> Login with Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;

