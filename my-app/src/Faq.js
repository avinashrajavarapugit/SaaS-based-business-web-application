import React, { useState } from 'react';
import './Faq.css';

const Faq = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqItems = [
    {
      question: "What is Ransack?",
      answer: "Ransack is a business that offers a variety of services to help companies improve their online presence, including SEO, web design, and social media marketing.",
    },
    {
      question: "How can Ransack help my business?",
      answer: "Our team of experts can work with you to develop a comprehensive strategy that will help your business attract more customers and increase your online visibility.",
    },
    {
      question: "What types of businesses does Ransack work with?",
      answer: "We work with businesses of all sizes, from small startups to large corporations, in a variety of industries including technology, healthcare, and e-commerce.",
    },
    {
      question: "What is the process for working with Ransack?",
      answer: "After you contact us, we will set up a consultation to discuss your business goals and determine the best approach to achieve them. From there, we will work with you to develop and implement a customized plan.",
    },
    {
      question: "How much does Ransack's services cost?",
      answer: "The cost of our services varies depending on the scope of the project and the specific needs of your business. We will provide a detailed estimate after our initial consultation.",
    },
  ];

  const renderedItems = faqItems.map((item, index) => {
    const isActive = index === activeIndex;
    const iconClass = isActive ? 'minus' : 'plus';

    return (
      <div className="item" key={index}>
        <div className="question" onClick={() => setActiveIndex(index)}>
          <i className={`fas fa-${iconClass}`}></i>
          {item.question}
        </div>
        <div className={`answer ${isActive ? 'active' : ''}`}>
          {item.answer}
        </div>
      </div>
    );
  });

  return (
    <div className="faq">
      <h1>FAQ</h1>
      {renderedItems}
    </div>
  );
};

export default Faq;

