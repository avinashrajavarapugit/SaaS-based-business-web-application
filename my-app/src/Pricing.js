import React from 'react'
import './Pricing.css'
import { Link } from 'react-router-dom'
export default function Pricing() {
  return (
    <div>
    <div class="header1">
        Pricing
    </div>
    <div class="pricing-container">
  <div class="pricing-card">
    <h3 class="pricing-title">Basic</h3>
    <p class="pricing-price">$29.99/month</p>
    <ul class="pricing-features">
      <li>10 GB Storage</li>
      <li>100 GB Bandwidth</li>
      <li>100 Email Accounts</li>
      <li>24/7 Support</li>
    </ul>
    <Link to="/Payment"><button class="pricing-button"  href="/Payment">Get Started</button></Link>
  </div>
  <div class="pricing-card">
    <h3 class="pricing-title">Pro</h3>
    <p class="pricing-price">$59.99/month</p>
    <ul class="pricing-features">
      <li>20 GB Storage</li>
      <li>200 GB Bandwidth</li>
      <li>200 Email Accounts</li>
      <li>24/7 Support</li>
      <li>Advanced Analytics</li>
    </ul>
    <Link to="/Payment"><button class="pricing-button"  href="/Payment">Get Started</button></Link>
  </div>
  <div class="pricing-card">
    <h3 class="pricing-title">Enterprise</h3>
    <p class="pricing-price">$99.99/month</p>
    <ul class="pricing-features">
      <li>50 GB Storage</li>
      <li>500 GB Bandwidth</li>
      <li>500 Email Accounts</li>
      <li>24/7 Support</li>
      <li>Advanced Analytics</li>
      <li>Dedicated Account Manager</li>
    </ul>
    <button class="pricing-button"  href="/Payment">Get Started</button>
  </div>
</div>
</div>

  )
}
