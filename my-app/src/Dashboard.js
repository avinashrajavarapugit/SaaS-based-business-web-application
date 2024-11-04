import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <p>Subscription Plan: {user.subscriptionPlan}</p>
      <p>Balance: {user.balance}</p>
      <p>Pending Tasks: {user.pendingTasks}</p>
    </div>
  );
};

export default Dashboard;
