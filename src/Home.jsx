import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import { useAuth } from './context/AuthContext';
import axios from 'axios';

function Home({ handleOpenAuthModal, basePath }) {
    const { userId, isLoggedIn } = useAuth();
    
    // Declare state for listings
    const [listings, setListings] = useState([]); // Missing declaration of listings and setListings
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        priceRange: '',
        bedrooms: '',
        propertyType: '',
        sortBy: '',
    });

    const convertPriceToNumber = (price) => {
        if (!price) return 0;
        return parseInt(price.replace(/[^0-9]/g, ''), 10);
    };

    // Fetch the listings from the public folder
    const fetchListings = async () => {
        try {
            // Fetch from the listings.json in the public folder using basePath
            const response = await axios.get(`${basePath}/listings.json`);
            console.log('Fetched listings:', response.data);
            setListings(response.data);  // Use setListings to update state with the listings data
        } catch (error) {
            console.error('Error fetching listings:', error);
        }
    };

    useEffect(() => {
        fetchListings(); // Call the fetchListings function when the component mounts
    }, []); // Make sure to include an empty dependency array so it only runs once on mount

    const handleAddToWishlist = async (property) => {
        if (!isLoggedIn) {
            handleOpenAuthModal();
            return;
        }
    
        try {
            // For GitHub Pages, remove the backend API call, use local state instead
            console.log("Adding to wishlist:", property.id);
            // Assuming you have addToWishlist implemented in a higher level component
            addToWishlist(property);  
        } catch (error) {
            console.error('Error adding to wishlist:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const filteredListings = listings
        .filter(property => {
            const priceAsNumber = convertPriceToNumber(property.price);
            const matchesSearch = 
                (property.title && property.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (property.description && property.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPrice = !filters.priceRange || 
                (priceAsNumber >= parseInt(filters.priceRange.split(',')[0]) && priceAsNumber <= parseInt(filters.priceRange.split(',')[1]));
            const matchesBedrooms = !filters.bedrooms || 
                (property.title && property.title.toLowerCase().includes(`${filters.bedrooms} bedroom`.toLowerCase()));
            const matchesPropertyType = !filters.propertyType || 
                (property.title && property.title.toLowerCase().includes(filters.propertyType.toLowerCase()));

            return matchesSearch && matchesPrice && matchesBedrooms && matchesPropertyType;
        })
        .sort((a, b) => {
            if (filters.sortBy === 'priceLowToHigh') {
                return convertPriceToNumber(a.price) - convertPriceToNumber(b.price);
            } else if (filters.sortBy === 'priceHighToLow') {
                return convertPriceToNumber(b.price) - convertPriceToNumber(a.price);
            } else if (filters.sortBy === 'newest') {
                return b.id - a.id;
            }
            return 0;
        });

    return (
        <div className="home-page">
            <h1>Find Your Dream Home Today!</h1>
            <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                    padding: '8px',
                    marginBottom: '15px',
                    fontSize: '14px',
                    width: '100%',
                    maxWidth: '400px'
                }}
            />

            <div className="filters">
                <label>
                    Price Range:
                    <select name="priceRange" onChange={handleFilterChange}>
                        <option value="">All</option>
                        <option value="0,100000">Up to $100,000</option>
                        <option value="100000,300000">$100,000 - $300,000</option>
                        <option value="300000,500000">$300,000 - $500,000</option>
                        <option value="500000,1000000">$500,000 - $1,000,000</option>
                        <option value="1000000,100000000">Over $1,000,000</option>
                    </select>
                </label>

                <label>
                    Bedrooms:
                    <select name="bedrooms" onChange={handleFilterChange}>
                        <option value="">All</option>
                        <option value="1">1 Bedroom</option>
                        <option value="2">2 Bedrooms</option>
                        <option value="3">3 Bedrooms</option>
                        <option value="4">4 Bedrooms</option>
                        <option value="5">5+ Bedrooms</option>
                    </select>
                </label>

                <label>
                    Property Type:
                    <select name="propertyType" onChange={handleFilterChange}>
                        <option value="">All</option>
                        <option value="House">House</option>
                        <option value="Condo">Condo</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Land">Land</option>
                    </select>
                </label>

                <label>
                    Sort By:
                    <select name="sortBy" onChange={handleFilterChange}>
                        <option value="">None</option>
                        <option value="priceLowToHigh">Price: Low to High</option>
                        <option value="priceHighToLow">Price: High to Low</option>
                        <option value="newest">Newest Listings</option>
                    </select>
                </label>
            </div>

            {filteredListings.length > 0 ? (
                <div className="property-grid">
                    {filteredListings.map((property, index) => (
                        <PropertyCard
                            key={index}
                            property={property}
                            addToWishlist={() => handleAddToWishlist(property)}
                            basePath = {basePath}
                        />
                    ))}
                </div>
            ) : (
                <p>No properties match your criteria.</p>
            )}
        </div>
    );
}

export default Home;
