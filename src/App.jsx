import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Home from './Home'; 
import ListProperty from './ListProperty';
import Wishlist from './Wishlist';
import PropertyDetails from './PropertyDetails'; 
import Buy from './Buy';
import PrivateRoute from './components/PrivateRoute';
import Auth from './components/Auth'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';

function App() {
    const isProduction = process.env.NODE_ENV === 'production';
    const basePath = isProduction ? '/test' : '';  // Adjust for production deployment, e.g., GitHub Pages
    const [listings, setListings] = useState([]); 
    const [wishlist, setWishlist] = useState([]);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/');
    const [loading, setLoading] = useState(true);  
    const [error, setError] = useState(null);      

    // Function to fetch the listings from the listings.json file
    const fetchListings = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch the listings.json file from the public directory
            const response = await axios.get(`${basePath}/listings.json`);
            console.log('Fetched listings:', response.data);  
            setListings(response.data);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setError('Failed to load listings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();  // Fetch listings when the component mounts
    }, []);

    const addListing = () => {
        fetchListings(); 
    };

    const addToWishlist = (property) => {
        if (!wishlist.some(item => item.id === property.id)) {
            console.log("Adding property to wishlist:", property);
            setWishlist([...wishlist, property]);
        } else {
            console.log("Property already in wishlist.");
        }
    };

    const removeFromWishlist = (property) => {
        setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== property.id));
    };

    const handleOpenAuthModal = (path) => {
        setRedirectPath(path);
        setAuthModalOpen(true);
    };

    const handleCloseAuthModal = () => setAuthModalOpen(false);

    return (
        <AuthProvider>
            <Router basename={basePath}>
                <AppContent
                    listings={listings}
                    addListing={addListing}
                    wishlist={wishlist}
                    addToWishlist={addToWishlist}
                    removeFromWishlist={removeFromWishlist}
                    isAuthModalOpen={isAuthModalOpen}
                    handleOpenAuthModal={handleOpenAuthModal}
                    handleCloseAuthModal={handleCloseAuthModal}
                    redirectPath={redirectPath}
                    basePath={basePath}
                    loading={loading}  
                    error={error}      
                />
            </Router>
        </AuthProvider>
    );
}

function AppContent({ listings, addListing, wishlist, addToWishlist, removeFromWishlist, isAuthModalOpen, handleOpenAuthModal, handleCloseAuthModal, redirectPath, basePath, loading, error }) {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const handleAddToWishlist = (property) => {
        if (!isLoggedIn) {
            handleOpenAuthModal('/wishlist');
        } else {
            addToWishlist(property);
        }
    };

    const handleBuyNow = (property) => {
        if (!isLoggedIn) {
            handleOpenAuthModal(`/buy/${property.id}`);
        } else {
            navigate(`/buy/${property.id}`, { state: { property } });
        }
    };

    const handleCloseModalAndRedirect = () => {
        handleCloseAuthModal();
        if (isLoggedIn) {
            navigate(redirectPath);
        }
    };

    return (
        <div>
            <nav className="navbar">
                <ul className="nav-links">
                    <li><Link to="/">Home</Link></li>
                    <li>
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            if (!isLoggedIn) {
                                handleOpenAuthModal('/wishlist');
                            } else {
                                navigate('/wishlist');
                            }
                        }}>Wishlist</a>
                    </li>
                    <li>
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            if (!isLoggedIn) {
                                handleOpenAuthModal('/list-property');
                            } else {
                                navigate('/list-property');
                            }
                        }}>Sell</a>
                    </li>
                    <li className="nav-sign-in">
                        {isLoggedIn ? (
                            <button onClick={logout} className="btn-signout">Sign out</button>
                        ) : (
                            <button onClick={() => handleOpenAuthModal()} className="btn-signin">Sign in</button>
                        )}
                    </li>
                </ul>
                <div className="theTitle">
                    <img src={`${basePath}/house.png`} alt="house icon" className="title-icon" />
                    <span className="title-text">TheRealEstate</span>
                </div>
            </nav>
            
            {error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : loading ? (
                <p>Loading listings...</p>
            ) : (
            <Routes>
                <Route 
                    path="/" 
                    element={<Home 
                                listings={listings} 
                                addToWishlist={handleAddToWishlist} 
                                handleOpenAuthModal={handleOpenAuthModal}
                                basePath={basePath}  // Pass basePath to Home component
                            />} 
                />
                <Route 
                    path="/property/:id" 
                    element={<PropertyDetails 
                                listings={listings} 
                                onBuy={handleBuyNow} 
                                handleOpenAuthModal={handleOpenAuthModal}
                                basePath={basePath}  // Pass basePath to PropertyDetails component
                            />} 
                />
                <Route 
                    path="/wishlist" 
                    element={
                        <PrivateRoute openAuthModal={handleOpenAuthModal}>
                            <Wishlist 
                                wishlist={wishlist} 
                                removeFromWishlist={removeFromWishlist} 
                                basePath={basePath}  // Pass basePath to Wishlist if it needs it (for images)
                            />
                        </PrivateRoute>
                    }
                />
                <Route 
                    path="/list-property" 
                    element={
                        <PrivateRoute openAuthModal={handleOpenAuthModal}>
                            <ListProperty 
                                addListing={addListing} 
                                basePath={basePath}  // Pass basePath if needed for ListProperty
                            />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/buy/:id" 
                    element={
                        <PrivateRoute openAuthModal={handleOpenAuthModal}>
                            <Buy 
                                basePath={basePath}  // Pass basePath if needed for Buy component
                            />
                        </PrivateRoute>
                    } 
                />
            </Routes>
            )}

            <Auth isOpen={isAuthModalOpen} onClose={handleCloseModalAndRedirect} />
        </div>
    );
}

export default App;
