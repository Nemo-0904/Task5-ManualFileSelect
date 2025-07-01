import React from "react";

function Footer() {
  return (
    <footer id="contact" className="footer-contact">
      <p>Connect with us:</p>
      <div className="social-buttons">
        <a href="mailto:support@Roboticco.com" target="_blank" rel="noopener noreferrer" className="social-btn email">
          <i className="fas fa-envelope"></i>
        </a>
        <a href="https://linkedin.com/company/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn linkedin">
          <i className="fab fa-linkedin-in"></i>
        </a>
        <a href="https://github.com/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn github">
          <i className="fab fa-github"></i>
        </a>
        <a href="https://instagram.com/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn insta">
          <i className="fab fa-instagram"></i>
        </a>
      </div>
      <p className="footer-copy">&copy; 2025 Robotic Co. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
