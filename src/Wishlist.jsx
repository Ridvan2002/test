import React, { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';
import { useAuth } from './context/AuthContext';

function Wishlist() {
    const { userId } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    
    // Fetch wishlist from public JSON file (simulating user-specific data)
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                // Adjust this path based on where your wishlist data is stored in the public folder
                const response = await fetch(`${process.env.PUBLIC_URL}/wishlist.json`);
                if (!response.ok) {
                    throw new Error('Failed to load wishlist data');
                }
                const data = await response.json();
                // Simulate user-specific wishlist by filtering based on userId (if needed)
                const userWishlist = data.filter(item => item.userId === userId);
                setWishlist(userWishlist);
            } catch (error) {
                console.error('Error fetching wishlist:', error);
            }
        };

        fetchWishlist();
    }, [userId]);

    // Simulate removing from wishlist (in client state)
    const removeFromWishlist = (id) => {
        setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id));
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
