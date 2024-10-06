import React, { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';
import { useAuth } from './context/AuthContext';
import api from './utils/api';

function Wishlist() {
    const { userId } = useAuth();
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (userId) {
                try {
                    const response = await api.get(`/wishlist/${userId}`);
                    setWishlist(response.data);
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                }
            }
        };
        fetchWishlist();
    }, [userId]);

    const removeFromWishlist = async (propertyId) => {
        try {
            await api.delete('/wishlist', { data: { userId, propertyId } });
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
