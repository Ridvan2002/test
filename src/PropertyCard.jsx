import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import './styles/PropertyCard.css';

// Utility function to format the price for display
const formatPriceForDisplay = (price) => {
    if (!price) return '';
    const numberPrice = parseInt(price, 10);
    return `$${numberPrice.toLocaleString()}`;
};

function PropertyCard({ property, addToWishlist, removeFromWishlist, isWishlist, handleOpenAuthModal }) {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth(); 

    const handleAddToWishlist = () => {
        if (!isLoggedIn) {
            handleOpenAuthModal('/wishlist'); // Open authentication modal if not logged in
        } else {
            addToWishlist(property); // Add property to wishlist
            navigate('/wishlist'); // Navigate to wishlist page
        }
    };

    const handleRemoveFromWishlist = () => {
        removeFromWishlist(property); // Remove property from wishlist
    };

    return (
        <div className="property-card">
            <img src={`http://localhost:5000/${property.image}`} alt={property.title} className="property-image" />
            <div className="property-details">
                <h2>{property.title}</h2>
                <p>{property.address}</p>
                <p><strong>Price:</strong> {formatPriceForDisplay(property.price)}</p> {/* Display formatted price */}
                <div className="property-actions">
                    <Link to={`/property/${property.id}`} className="btn-primary">Details</Link>
                    {isWishlist ? (
                        <button className="btn-secondary btn-remove-from-wishlist" onClick={handleRemoveFromWishlist}>
                            Remove
                        </button>
                    ) : (
                        <button className="btn-secondary btn-add-to-wishlist" onClick={handleAddToWishlist}>
                            Add to Wishlist
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PropertyCard;
