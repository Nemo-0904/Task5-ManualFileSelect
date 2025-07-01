// Robotic_Co/frontend/src/pages/PaymentSuccessPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function PaymentSuccessPage() {
  // Optional: Add a class to the body for specific background color
  // or wrap the content in a div with the desired background
  useEffect(() => {
    document.body.classList.add('payment-success-body');
    return () => {
      document.body.classList.remove('payment-success-body');
    };
  }, []);

  return (
    // If you prefer to wrap content instead of applying to body, use this:
    // <div className="payment-success-body">
      <div className="payment-success-container">
        <h1>🎉 Payment Successful!</h1>
        <p>Thank you for your purchase.</p>
        <p><Link to="/">Return to Home</Link></p>
      </div>
    // </div>
  );
}

export default PaymentSuccessPage;