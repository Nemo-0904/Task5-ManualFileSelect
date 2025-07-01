// frontend/src/components/About.jsx
import React, { useEffect } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

// If image is in public folder, use the direct path below
const aboutImage = "/images/About-us.jpg";

// If your image is in src/assets/, use:
// import aboutImage from '../assets/about-robot.png';

function About() {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <section className="about-us-section" id="about">
        <div className="about-container">
          <div className="about-text" data-aos="fade-right">
            <h2>About Robotic Co.</h2>
            <p>
              At Robotic Co., we are pioneers in developing advanced robotic systems
              that transform industries. From autonomous solutions to precision
              manufacturing robots, our innovations drive efficiency, safety,
              and productivity. We believe in a future where robotics empowers
              human potential.
            </p>
            <p>
              Our team of expert engineers and researchers is dedicated to pushing
              the boundaries of what's possible, delivering robust and intelligent
              robots tailored to meet complex challenges across various sectors.
            </p>
          </div>
          <div className="about-image" data-aos="fade-left">
            <img src={aboutImage} alt="About Us Robot" loading="lazy" />
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
