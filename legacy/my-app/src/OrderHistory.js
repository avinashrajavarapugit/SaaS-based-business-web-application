import React from 'react';

const OrderHistory = ({ orders }) => {
  return (
    <div>
      <h2>Order History</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            <p>Date: {order.date}</p>
            <p>Status: {order.status}</p>
            <p>Amount: {order.amount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderHistory;
