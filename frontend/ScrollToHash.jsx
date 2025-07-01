// Robotic_Co/frontend/src/components/ScrollToHash.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    // Wait for DOM updates to complete
    setTimeout(() => {
      if (location.hash) {
        const id = location.hash.substring(1); // remove the '#'
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Optional: apply offset manually if scroll-margin-top CSS is not set
          // window.scrollBy(0, -80); // Uncomment if needed
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100); // Delay ensures element is rendered
  }, [location]);

  return null; // This component doesn't render anything
}

export default ScrollToHash;
