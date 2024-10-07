import React, { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';
import { useAuth } from './context/AuthContext';

function Wishlist() {
    const { userId } = useAuth();
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (userId) {
                try {
                    const response = await fetch(`https://test-backend-d88x.onrender.com/api/wishlist/${userId}`);
                    const data = await response.json();
                    setWishlist(data);
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                }
            }
        };
        fetchWishlist();
    }, [userId]);

    const removeFromWishlist = async (propertyId) => {
        try {
            // Send a DELETE request to remove the property from the wishlist
            await fetch('https://test-backend-d88x.onrender.com/api/wishlist', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, propertyId }),
            });

            // Update the state to remove the property from the UI
            setWishlist(wishlist.filter(item => item.id !== propertyId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    return (
        <div className="wishlist-page">
            <h1>Your Wishlist</h1>
            {wishlist.length > 0 ? (
                <div className="property-grid">
                    {wishlist.map((property, index) => (
                        <PropertyCard
                            key={index}
                            property={property}
                            removeFromWishlist={() => removeFromWishlist(property.id)}
                            isWishlist={true}
                        />
                    ))}
                </div>
            ) : (
                <p>Your wishlist is empty.</p>
            )}
        </div>
    );
}

export default Wishlist;
