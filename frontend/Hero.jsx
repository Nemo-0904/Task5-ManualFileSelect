import React from "react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <h1>Innovation in Robotics</h1>
      <p>Your partner for cutting-edge robotic solutions.</p>
      <Link to="/products" className="cta-btn">Explore Products</Link>
    </section>
  );
}

export default Hero;
