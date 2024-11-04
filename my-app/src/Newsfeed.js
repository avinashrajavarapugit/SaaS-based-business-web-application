import React, { useState } from 'react';
import "./Newsfeed.css";

const NewsFeed = () => {
  const [news, setNews] = useState([
    {
      id: 1,
      title: "                                                                             Ransack partners with top companies to increase employee retention",
      content: "Ransack, a leading services provider that specializes in using machine learning to help companies increase employee retention, has announced partnerships with several top companies in the tech industry.",
      date: "April 22, 2022"
    },
    {
      id: 2,
      title: "Study shows Ransack's approach to employee retention leads to higher job satisfaction",
      content: "A recent study conducted by a leading research firm has found that companies that use Ransack's machine learning-based approach to employee retention have significantly higher job satisfaction rates among their employees.",
      date: "March 15, 2022"
    },
    {
      id: 3,
      title: "Ransack named Best Services Provider at industry awards",
      content: "Ransack has been named Best Services Provider at the 2022 Tech Industry Awards, in recognition of the company's innovative and effective approach to helping organizations increase employee retention.",
      date: "February 28, 2022"
    },
    {
      id: 4,
      title: "Ransack releases new whitepaper on employee retention strategies",
      content: "Ransack has released a new whitepaper outlining the latest strategies and best practices for increasing employee retention in today's fast-paced business environment. The whitepaper is available for download on the Ransack website.",
      date: "January 10, 2022"
    },
    {
      id: 5,
      title: "Ransack expands operations to Europe",
      content: "Ransack has announced that it is expanding its operations to Europe, with a new office opening in London. The move is part of the company's ongoing efforts to provide its machine learning-based employee retention services to companies around the world.",
      date: "December 1, 2021"
    }
  ]);
  
  const [showMore, setShowMore] = useState(false);
  const toggleShowMore = () => setShowMore(!showMore);

  return (
    <div className='news'>
    <div className="news-feed-container">
        <div className='headnews'>
      <h2>News Room</h2>
      </div>
      {news.slice(0, showMore ? news.length : 3).map(article => (
        <div key={article.id} className="news-container">
          <h3 className="news-title">{article.title}</h3>
          <p className="news-date">{article.date}</p>
          <p className="news-content">{article.content}</p>
          <hr className="news-divider" />
        </div>
      ))}
      {news.length > 3 && (
        <div className="show-more-button-container">
          <button className="show-more-button" onClick={toggleShowMore}>
            {showMore ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

export default NewsFeed;
