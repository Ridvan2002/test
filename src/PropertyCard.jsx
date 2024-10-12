import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import './styles/PropertyCard.css';

const formatPriceForDisplay = (price) => {
    if (!price) return '';
    const numberPrice = parseInt(price, 10);
    return `$${numberPrice.toLocaleString()}`;
};

function PropertyCard({ property, addToWishlist, removeFromWishlist, isWishlist, handleOpenAuthModal, basePath }) {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const handleAddToWishlist = () => {
        if (!isLoggedIn) {
            handleOpenAuthModal('/wishlist');
        } else {
            const storedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
            const updatedWishlist = [...storedWishlist, property];
            localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
            addToWishlist(property);
            navigate('/wishlist');
        }
    };

    const handleRemoveFromWishlist = () => {
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const updatedWishlist = storedWishlist.filter(item => item.id !== property.id);
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        removeFromWishlist(property.id);
    };

    return (
        <div className="property-card">
            <img 
                src={property.mainImage ? `${basePath}${property.mainImage}` : `${basePath}/default-image.jpg`} 
                alt={property.title || 'Property'} 
                className="property-image" 
            />

            <div className="property-details">
                <h2>{property.title ? property.title : `${property.bedrooms}-bedroom ${property.propertyType}`}</h2>
                <p>{property.address}</p>
                <p><strong>Price:</strong> {formatPriceForDisplay(property.price)}</p>
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
