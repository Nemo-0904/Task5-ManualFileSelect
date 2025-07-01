import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToHash';

// Import RobotControlApp (our URDF viewer page)
import RobotControlApp from "./pages/RobotControlApp.jsx"; // Ensure correct extension .jsx

// Pages (Lazy load for performance; optional - keep existing lazy loads)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));

const PaymentSuccessPage = React.lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelledPage = React.lazy(() => import('./pages/PaymentCancelledPage'));

// Styles
import './styles/global.css';

function App() {
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Authentication check (using localStorage as you had it)
    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <Router>
            <ScrollToTop />
            {/*
                The main App container.
                - flex flex-col: Makes this a flex container and arranges its children vertically.
                - h-screen: Makes the container take up the full height of the viewport.
                - overflow-hidden: Prevents scrollbars on the main body unless specifically allowed by child elements.
            */}
            <div className="flex flex-col h-screen overflow-hidden">
                {/* Navbar is a fixed height at the top. flex-none ensures it doesn't grow. */}
                <Navbar onShowCartClick={() => setIsCartOpen(true)} className="flex-none" />

                {/*
                    This div will take the remaining vertical space after the Navbar.
                    It will contain all your route-specific page content.
                    Since RobotControlApp itself uses flex-grow for its internal layout,
                    this container ensures it has vertical space to grow into.
                */}
                <div className="flex-grow overflow-hidden"> {/* overflow-hidden helps manage internal scrollbars */}
                    {/* Suspense is for lazy-loaded components */}
                    <Suspense fallback={<div className="text-center mt-8">Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                                path="/products"
                                element={
                                    <ProductsPage
                                        isCartOpen={isCartOpen}
                                        setIsCartOpen={setIsCartOpen}
                                    />
                                }
                            />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/success" element={<PaymentSuccessPage />} />
                            <Route path="/cancel" element={<PaymentCancelledPage />} />

                            {/*
                                The /control route now correctly renders RobotControlApp.
                                RobotControlApp's internal flex layout (sidebar + viewer)
                                will now work because its parent (<div className="flex-grow overflow-hidden">)
                                has a defined height.
                            */}
                            <Route
                                path="/control"
                                element={
                                    isAuthenticated ? (
                                        <RobotControlApp /> // RENDER RobotControlApp HERE
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />

                            {/* Catch-all route (redirects to home for unknown paths) */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
        </Router>
    );
}

export default App;
