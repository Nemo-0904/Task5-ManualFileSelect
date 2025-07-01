// Robotic_Co/frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import 'aos/dist/aos.css';



// Import Font Awesome CSS (if using their CDN or npm package)
// If you installed @fortawesome/fontawesome-free:
import '@fortawesome/fontawesome-free/css/all.min.css';
// If you are using individual packages like @fortawesome/free-solid-svg-icons and @fortawesome/react-fontawesome:
// (You would typically import specific icons in components where they are used)

ReactDOM.createRoot(document.getElementById('root')).render(
 // <React.StrictMode>
    <App />
 // </React.StrictMode>,
);