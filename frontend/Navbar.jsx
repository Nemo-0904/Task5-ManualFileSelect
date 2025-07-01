// frontend/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ onShowCartClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const userString = localStorage.getItem('user');
        let user = null;

        // CRITICAL FIX: Only attempt JSON.parse if userString is not null/undefined string
        if (userString && userString !== "undefined") {
          user = JSON.parse(userString);
        }

        if (user && user.name) {
          setUserName(user.name);
        } else if (user && user.email) {
          setUserName(user.email);
        } else {
          setUserName('User');
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        setUserName('User');
        // Optional: If parsing consistently fails, you might want to clear the bad 'user' item
        // localStorage.removeItem('user');
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [location]); // Keep location in dependency array to re-run on route changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Also remove the 'user' data
    setIsLoggedIn(false);
    setUserName('');
    window.location.reload(); // Reload the page to ensure all state/context is reset
  };

  return (
    <header>
      <nav className="navbar">
        <div className="logo">Robotic Co.</div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          {/* Links to specific sections on the home page */}
          <li><Link to="/#blog-section">Blogs</Link></li>
          <li><Link to="/#services-section">Services</Link></li>
          <li><Link to="/control">Tools</Link></li>
          <li><a href="#contact">Contact</a></li>

          {location.pathname === '/products' && (
            <li>
              <a href="#" id="show-cart" onClick={(e) => { e.preventDefault(); onShowCartClick(); }}>
                Show Cart<span id="cart-count">(0)</span>
              </a>
            </li>
          )}

          {isLoggedIn ? (
            <>
              <li><span className="Welcome">Welcome, {userName}!</span></li>
              <li><button onClick={handleLogout} className="btn logout" aria-label="Logout" >Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn login">Login</Link></li>
              <li><Link to="/signup" className="btn signup">Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;