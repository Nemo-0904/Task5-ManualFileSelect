import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true); // Set loading state to true

    try {
      console.log("Attempting signup with:", { name, email });
      // Corrected endpoint to match backend port (5000)
      const response = await fetch(`http://localhost:5000/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('Signup response received:', response);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON during signup:', jsonError);
          setError(`HTTP error! Status: ${response.status}. Please check server logs.`);
          return;
        }
        throw new Error(errorData.message || `Signup failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Signup successful:', data);
      setSuccessMessage(data.message || 'Signup successful! Redirecting to login...');

      setName('');
      setEmail('');
      setPassword('');

      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error('Signup error:', err.message);
      setError(err.message || 'An unexpected error occurred during signup. Please try again.');
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  return (
    <div className="form-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={() => setShowPassword(!showPassword)} className="password-toggle">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
          </span>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default SignupPage;
