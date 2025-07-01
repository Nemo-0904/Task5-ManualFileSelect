import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// IMPORTANT: Ensure you have the Stripe.js script loaded in your public/index.html
// Example: <script src="https://js.stripe.com/v3/"></script>

const PRODUCTS_DATA = [
  {
    id: 'prod_explorer_rover',
    name: 'Explorer Rover',
    description: 'For rough terrain and GPS navigation.',
    price: 12000,
    image: 'https://placehold.co/400x300/E0F2F7/0072FF?text=Explorer+Rover',
    category: 'Autonomous Robots'
  },
  {
    id: 'prod_mini_delivery_bot',
    name: 'Mini Delivery Bot',
    description: 'Indoor autonomous robot with object detection.',
    price: 4000,
    image: 'https://placehold.co/400x300/F0FFF4/28A745?text=Mini+Delivery+Bot',
    category: 'Autonomous Robots'
  },
  {
    id: 'prod_line_follower_kit_1',
    name: 'Line Follower Kit',
    description: 'DIY educational robot kit. Perfect for beginners in electronics and robotics. Easy to assemble, with IR sensors and Arduino control system support.',
    price: 30000,
    image: 'https://placehold.co/400x300/FFF3E0/FF9800?text=Line+Follower+Kit',
    category: 'Educational Kits'
  },
  {
    id: 'prod_line_follower_kit_2',
    name: 'Line Follower Kit (Advanced)',
    description: 'DIY educational robot kit. Perfect for beginners in electronics and robotics. Easy to assemble, with IR sensors and Arduino control system support.',
    price: 344000,
    image: 'https://placehold.co/400x300/FFF3E0/FF9800?text=Line+Follower+Kit+Advanced',
    category: 'Educational Kits'
  },
  {
    id: 'prod_mini_delivery_bot_2',
    name: 'Mini Delivery Bot (Pro)',
    description: 'Indoor autonomous robot with object detection.',
    price: 45000,
    image: 'https://placehold.co/400x300/F0FFF4/28A745?text=Mini+Delivery+Bot+Pro',
    category: 'Autonomous Robots'
  },
  {
    id: 'prod_explorer_rover_2',
    name: 'Explorer Rover (Pro)',
    description: 'For rough terrain and GPS navigation.',
    price: 45000,
    image: 'https://placehold.co/400x300/E0F2F7/0072FF?text=Explorer+Rover+Pro',
    category: 'Autonomous Robots'
  },
  {
    id: 'prod_industrial_arm',
    name: 'Industrial Robotic Arm',
    description: 'High-precision arm for manufacturing and assembly.',
    price: 250000,
    image: 'https://placehold.co/400x300/E3F2FD/1A237E?text=Industrial+Arm',
    category: 'Industrial Robots'
  },
  {
    id: 'prod_ai_vision_module',
    name: 'AI Vision Module',
    description: 'Advanced AI module for object recognition and tracking.',
    price: 15000,
    image: 'https://placehold.co/400x300/FCE4EC/C2185B?text=AI+Vision+Module',
    category: 'AI Modules'
  }
];

// Get unique categories for the filter buttons
const ALL_CATEGORIES = ['All Products', ...new Set(PRODUCTS_DATA.map(product => product.category))];

function ProductsPage({ isCartOpen, setIsCartOpen }) {
  const [cartItems, setCartItems] = useState([]);
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category');
    if (categoryFromUrl) {
      const foundCategory = ALL_CATEGORIES.find(cat =>
        cat.toLowerCase().replace(/\s/g, '-') === categoryFromUrl
      );
      if (foundCategory) setSelectedCategory(foundCategory);
    } else {
      setSelectedCategory('All Products');
    }
  }, [location.search]);

  const filteredProducts = selectedCategory === 'All Products'
    ? PRODUCTS_DATA
    : PRODUCTS_DATA.filter(p => p.category === selectedCategory);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (productId) => {
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (product) {
      setCartItems(prev => {
        const exists = prev.find(item => item.id === productId);
        return exists
          ? prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item)
          : [...prev, { ...product, quantity: 1 }];
      });
      setIsCartOpen(true);
      showMessage('success', `${product.name} added to cart!`);
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === productId);
      if (exists && exists.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
    showMessage('info', 'Item removed from cart.');
  };

  const handleBuyNow = async () => {
    if (cartItems.length === 0) {
      showMessage('error', "Your cart is empty!");
      return;
    }

    setCheckoutLoading(true);

    try {
      // *** CRITICAL LINE: THIS IS THE ENDPOINT THAT NEEDS TO BE CORRECT ***
      // It should be '/api/payment/create-checkout-session' as per your backend
      const response = await fetch(`http://localhost:5000/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Send auth token
        },
        body: JSON.stringify({ items: cartItems }),
      });

      const session = await response.json();

      if (!response.ok) {
          const errorMessage = session.message || `Checkout failed with status: ${response.status}`;
          if (response.status === 401 || response.status === 403) {
              showMessage('error', 'Authentication required to proceed with payment. Please log in.');
          } else {
              showMessage('error', `Checkout failed: ${errorMessage}`);
          }
          console.error("Backend response error:", session);
          return;
      }

      if (!window.Stripe) {
        console.error("Stripe.js not loaded. Please add <script src='https://js.stripe.com/v3/'></script> to your index.html");
        showMessage('error', "Stripe payment system not ready. Please try again later.");
        return;
      }

      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) {
        console.error("Stripe checkout error:", error.message);
        showMessage('error', "Error during checkout: " + error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      showMessage('error', "Failed to initiate checkout. Please check your network and try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <section className="products-page-intro">
        <h2>Explore Our Robotic Solutions</h2>
        <p>Find the perfect robot for your industrial, educational, or autonomous needs.</p>
      </section>

      {/* Custom Message Box */}
      {message.text && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="category-filter-section">
        <h3>Filter by Category:</h3>
        <div className="category-buttons">
          {ALL_CATEGORIES.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="masonry-products">
        <div className="masonry-grid">
          {filteredProducts.length === 0 ? (
            <p className="no-products-found">No products found for this category.</p>
          ) : (
            filteredProducts.map(product => (
              <div className="masonry-item" key={product.id}>
                <div className="category-label">{product.category}</div>
                <img src={product.image} alt={product.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/DDDDDD/666666?text=Image+Not+Found'; }} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
                <button onClick={() => addToCart(product.id)}>Add to Cart</button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className={`cart-modal ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}></div>
        <div className="cart-content side-cart-content">
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
          <h2>Your Cart <span>({cartItems.length})</span></h2>
          <ul>
            {cartItems.length === 0 ? (
              <li>Your cart is empty.</li>
            ) : (
              cartItems.map(item => (
                <li key={item.id} className="cart-item-detail">
                  <span>{item.name} (x{item.quantity}) - ₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  <button className="remove-from-cart-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </li>
              ))
            )}
          </ul>
          <div className="cart-footer">
            <strong>Total: ₹{cartTotal.toLocaleString('en-IN')}</strong>
            <button id="buy-now-btn" onClick={handleBuyNow} disabled={checkoutLoading || cartItems.length === 0}>
              {checkoutLoading ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      <footer id="contact" className="contact">
        <p>Connect with us:</p>
        <div className="social-buttons">
          <a href="mailto:support@Roboticco.com" target="_blank" rel="noopener noreferrer" className="social-btn email" title="Email"><i className="fas fa-envelope"></i></a>
          <a href="https://linkedin.com/company/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn linkedin" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          <a href="https://github.com/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn github" title="GitHub"><i className="fab fa-github"></i></a>
          <a href="https://instagram.com/Roboticco" target="_blank" rel="noopener noreferrer" className="social-btn insta" title="Instagram"><i className="fab fa-instagram"></i></a>
        </div>
        <p className="footer-copy">&copy; 2025 Robotic Co. All rights reserved.</p>
      </footer>
    </>
  );
}

export default ProductsPage;
