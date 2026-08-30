import React, { useState } from 'react';
import './Home.css';
import image from'./a.jpg'
import { Link } from 'react-router-dom';
import Features from './Features';
import NewsFeed from './Newsfeed';
import Slides from './Slides';
const Home = () => {

  return (
    <div>
    <div class="container12">
        <img src={image} alt="Image" className="Container-logo12" />
  <div class="middle12">
    <div class="but12">
    </div>
    <div class="text12">"Revolutionize Your Workplace with Our Solution to Improve Employee Retention and Productivity.
Say goodbye to high turnover rates and lackluster productivity. Our cutting-edge solution uses advanced technology to optimize workplace satisfaction and boost your bottom line." </div>
  </div>
</div>
<Features />
<Slides />
<NewsFeed />
</div>


  );
};

export default Home;