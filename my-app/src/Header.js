import React, { useState, useContext } from 'react';
import { RiAccountCircleFill } from 'react-icons/ri';
import './Header.css';
import logo from './logo.png';
import logo1 from './logo1.png';
import logo2 from './logo2.jpg';
import profile from './profile.png';
import { loginContext } from './Context/loginContext';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [currentuser, error, userLoginStatus, loginuser, logoutuser] = useContext(loginContext);
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for joining the waiting list. We will reach out to you soon.');
    setShowForm(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="search">
          <img src={logo} alt="Logo" className="header-logo" />
          <img src={logo1} alt="Logo1" className="header-logo1" />
        </Link>
      </div>

      

      <nav className="header-right">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          Home
        </Link>
        
        <Link 
          to="/pricing" 
          className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}
        >
          Pricing
        </Link>
        
        <Link 
          to="/contact" 
          className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
        >
          Contact
        </Link>
        
        <Link 
          to="/support" 
          className={`nav-link ${isActive('/support') ? 'active' : ''}`}
        >
          Support
        </Link>

        {userLoginStatus ? (
          <Link to="/profile" className="profile-link">
            <img src={profile} className="header-profile-logo" alt="Profile" />
          </Link>
        ) : (
          <Link to="/signup" className="signup-link">
            <RiAccountCircleFill fontSize={'24px'} />
          </Link>
        )}

        <Link 
          to="/RequestDemo" 
          className={`nav-link ${isActive('/RequestDemo') ? 'active' : ''}`}
        >
          Request Demo
        </Link>

        <div className="join-waitlist">
          {showForm ? (
            <div className="waitlist-form">
              <h2>Join the waiting list</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Submit</button>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setShowForm(true)}
              className="waitlist-button"
            >
              Join Waitlist
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;




