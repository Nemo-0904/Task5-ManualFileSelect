import React from "react";
import Hero from "../components/Hero";
import About from "../components/About";
import BlogSection from "../components/BlogSection";
import Services from "../components/Services";
import Footer from "../components/Footer";



function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <BlogSection />
      <Services />
      <Footer />
    </>
  );
}

export default HomePage;
