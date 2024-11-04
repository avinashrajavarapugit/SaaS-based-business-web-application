import React, { useState } from 'react';
import { createBrowserRouter,RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';
import Home from './Home';
import './App.css';
import Pricing from './Pricing';
import Login from './Login';
import Header from './Header';
import Footer from './Footer';
import Signup from './Signup';
import Contact from './Contact';
import Support from './Support';
import Privacy from './Privacy';
import Slides from './Slides';
import Aboutus from './Aboutus';
import Payment from './Payment';
import Otp from './Otp'
import Faq from './Faq';
import TermsOfService from './TermsOfService';
import NewsFeed from './Newsfeed';
import Features from './Features';
import RequestDemo from './RequestDemo';
function App() {
  const router = createBrowserRouter([
    {
      path:"/",
      element:<RootLayout />,
      children:[
        {
          path:"",
          element:<Home />
        },
        {
          path:"pricing",
          element:<Pricing />
        },
        {
          path:"login",
          element:<Login />
        },
        {
          path:'signup',
          element:<Signup />
        },
        {
          path:'contact',
          element:<Contact />
        },
        {
          path:'support',
          element:<Support />
        },
        {
          path:'privacy',
          element:<Privacy />
        },
        {
          path:'aboutus',
          element:<Aboutus />
        },
        {
          path:'payment',
          element:<Payment promise={promise} />
        },
        {
          path:'faq',
          element:<Faq />
        },
        {
          path:'TermsofService',
          element:<TermsOfService />
        },{
          path:'Otp',
          element:<Otp />
        },
        {
          path:'RequestDemo',
          element:<RequestDemo />
        }
      ]
    }
  ]);
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}


export default App;

