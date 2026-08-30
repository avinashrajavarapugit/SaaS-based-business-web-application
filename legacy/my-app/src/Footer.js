import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import whatsapp from './facebook.png';
import instagram from './instagram.png';
import twitter from './twitter.png';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h3 className="footer-col-title">Company</h3>
          <ul className="footer-col-list">
            <li><Link to="/Aboutus">About Us</Link></li>
            <li><Link to="/Contact">Contact Us</Link></li>
            <li><Link to="#">Careers</Link></li>
            <li><Link to="#">Blog</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="footer-col-title">Resources</h3>
          <ul className="footer-col-list">
            <li><Link to="/Faq">FAQ</Link></li>
            <li><Link to="/Privacy">Privacy Policy</Link></li>
            <li><Link to="/TermsOfService">Terms of Service</Link></li>
          </ul>
        </div>
        <div className="footer-col1">
          <h3 className="footer-col-title1">Social</h3>
          <ul className="footer-col-listf">
            <a href="https://www.facebook.com/Ransackorg"> <img src={whatsapp} className="abn" alt="Facebook"/></a>
            <a href="https://twitter.com/Ransackorg?t=1ADz84PwqLixS3_fJVU-OQ&s=09">  <img src={twitter} className="abn" alt="Twitter"/></a>
            <a href="https://instagram.com/ransack__?igshid=ZDdkNTZiNTM=" >  <img src={instagram} className="abn" alt="Instagram"/></a>
          </ul>
        </div>
      </div>
      <div className="footer-copyright">
        &copy; {new Date().getFullYear()} Ransack | All Rights Reserved
      </div>
    </footer>
  );
}

export default Footer;


