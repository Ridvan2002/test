import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import './styles/PropertyCard.css';

const formatPriceForDisplay = (price) => {
    if (!price) return '';
    const numberPrice = parseInt(price, 10);
    return `$${numberPrice.toLocaleString()}`;
};

function PropertyCard({ property, addToWishlist, removeFromWishlist, isWishlist, handleOpenAuthModal }) {
    const navigate = useNavigate();
    const { isLoggedIn, userId } = useAuth();

    const handleAddToWishlist = async () => {
        if (!isLoggedIn) {
            handleOpenAuthModal('/wishlist'); 
        } else {
            try {
                console.log("Sending userId:", userId, "and id:", property.id); 
    
                const response = await fetch('http://localhost:5000/api/wishlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, id: property.id }), 
                });
    
                if (response.ok) {
                    console.log('Property added to wishlist successfully');
                    addToWishlist(property);  
                    navigate('/wishlist');
                } else {
                    const errorData = await response.json();
                    console.error('Error adding to wishlist:', errorData.message);
                }
            } catch (error) {
                console.error('Error adding to wishlist:', error);
            }
        }
    };    
    
    
    const handleRemoveFromWishlist = () => {
        removeFromWishlist(property.id); 
    };

    return (
        <div className="property-card">
            <img src={property.mainImage ? `http://localhost:5000${property.mainImage}` : '/default-image.jpg'} alt={property.title || 'Property'} className="property-image" />
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