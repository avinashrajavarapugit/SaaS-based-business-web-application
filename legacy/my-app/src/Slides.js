import React, { useState } from 'react';
import services1 from './Services1.png';
import services2 from './Services2.png';
import services3 from './Services3.png'
import './Slides.css';

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [services1, services2, services3];

  const handleSlideLeft = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSlideRight = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="slider">
      {slides.length > 0 && (
        <>
          <img src={slides[currentSlide]} alt={`Slide ${currentSlide + 1}`} />
          {currentSlide > 0 && (
            <div className="slider-arrow slider-arrow-left" onClick={handleSlideLeft}>
              &#8249;
            </div>
          )}
          {currentSlide < slides.length - 1 && (
            <div className="slider-arrow slider-arrow-right" onClick={handleSlideRight}>
              &#8250;
            </div>
          )}
        </>
      )}
      {slides.length > 1 && (
        <div className="slider-dots">
          {slides.map((slide, index) => (
            <div
              key={`dot-${index}`}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Slider;

