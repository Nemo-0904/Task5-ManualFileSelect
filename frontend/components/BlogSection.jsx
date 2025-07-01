// frontend/src/components/BlogSection.jsx
import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Link } from 'react-router-dom';


function BlogSection() {
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  const blogs = [
    {
      id: 1,
      image: "/images/blog1.jpg",
      title: "The Rise of AI in Robotics",
      description: "Exploring how artificial intelligence is revolutionizing the robotics industry...",
      link: "#", // Replace with blog route or modal trigger
    },
    {
      id: 2,
      image: "/images/blog2.jpeg",
      title: "Robots in Manufacturing: A New Era",
      description: "How industrial robots are transforming production lines and supply chains...",
      link: "#",
    },
    {
      id: 3,
      image: "/images/blog3.jpeg",
      title: "Future of Autonomous Delivery",
      description: "A look into the potential impact of delivery robots on urban logistics...",
      link: "#",
    },
  ];

  return (
    <section id="blog-section" className="blog-section">
      <h2>Our Latest Insights</h2>
      <div className="blog-grid">
        {blogs.map((blog) => (
          <div key={blog.id} className="blog-card" data-aos="fade-up">
            <img src={blog.image} alt={`Thumbnail for ${blog.title}`} loading="lazy" />
            <h3>{blog.title}</h3>
            <p>{blog.description}</p>
            <a href={blog.link} className="read-more">Read More</a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BlogSection;
