// Robotic_Co/frontend/src/components/Services.jsx
import React from "react";

function Services() {
  const services = [
    {
      id: 1,
      image: "/images/service1.jpg",
      title: "Custom Solutions",
      description: "Tailored robotic systems designed to meet your unique operational demands.",
    },
    {
      id: 2,
      image: "/images/service2.jpeg",
      title: "Integration Services",
      description: "Seamless integration of new robots into existing infrastructure.",
    },
    {
      id: 3,
      image: "/images/service3.jpeg",
      title: "Maintenance & Support",
      description: "Comprehensive after-sales support and preventative maintenance for longevity.",
    },
    {
      id: 4,
      image: "/images/service4.jpeg",
      title: "Consulting",
      description: "Expert advice on robotics adoption, strategy, and technological advancements.",
    },
  ];

  return (
    <section id="services-section" className="services-section">
      <h2>What We Offer</h2>
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <img src={service.image} alt={`${service.title} icon`} loading="lazy" />
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Services;
