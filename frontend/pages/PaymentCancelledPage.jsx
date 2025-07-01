// Robotic_Co/frontend/src/pages/PaymentCancelledPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function PaymentCancelledPage() {
  // Optional: Add a class to the body for specific background color
  useEffect(() => {
    document.body.classList.add('payment-cancelled-body');
    return () => {
      document.body.classList.remove('payment-cancelled-body');
    };
  }, []);

  return (
    // If you prefer to wrap content instead of applying to body, use this:
    // <div className="payment-cancelled-body">
      <div className="payment-cancelled-container">
        <h1>Payment Cancelled</h1>
        <p>You cancelled the transaction.</p>
        <p><Link to="/products">Go back to products</Link></p>
      </div>
    // </div>
  );
}

export default PaymentCancelledPage;