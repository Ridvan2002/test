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
                    const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    setWishlist(data);
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                }
            }
        };
        fetchWishlist();
    }, [userId]);

    const removeFromWishlist = async (id) => {
        try {
            const response = await fetch('http://localhost:5000/api/wishlist', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, id }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id));
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