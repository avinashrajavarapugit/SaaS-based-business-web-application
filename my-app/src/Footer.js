
import React from "react";
import "./Footer.css";
import whatsapp from './facebook.png';
import instagram from './instagram.png';
import twitter from './twitter.png'
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h3 className="footer-col-title">Company</h3>
          <ul className="footer-col-list">
            <li><a href="/Aboutus">About Us</a></li>
            <li><a href="/Contact">Contact Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="footer-col-title">Resources</h3>
          <ul className="footer-col-list">
            <li><a href="/Faq">FAQ</a></li>
            <li><a href="/Privacy">Privacy Policy</a></li>
            <li><a href="/TermsOfService">Terms of Service</a></li>
          </ul>
        </div>
        <div className="footer-col1">
          <h3 className="footer-col-title1">Social</h3>
          <ul className="footer-col-listf">
          
          <a href="https://www.facebook.com/Ransackorg"> <img src={ whatsapp }  className="abn"/></a>
          <a href="https://twitter.com/Ransackorg?t=1ADz84PwqLixS3_fJVU-OQ&s=09">  <img src={ twitter }  className="abn"/></a>
          <a href="https://instagram.com/ransack__?igshid=ZDdkNTZiNTM=" >  <img src={instagram} className="abn"/></a>
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

