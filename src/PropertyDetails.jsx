import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './styles/PropertyDetails.css';

function PropertyDetails({ listings, handleOpenAuthModal, onBuy }) {
    const { id } = useParams();  // Extract the id from the URL params
    const property = listings.find((listing) => listing.id === id); // Match `id` as a string
    
    const { isLoggedIn } = useAuth();
    const [visibleImages, setVisibleImages] = useState(0); // State to track visible images in the gallery
    const [lightboxImage, setLightboxImage] = useState(null); // State for lightbox view

    // Check if the property was found, otherwise show a message
    if (!property) {
        return <p>Property not found.</p>;
    }

    const handleBuyNow = () => {
        if (!isLoggedIn) {
            handleOpenAuthModal(`/buy/${property.id}`);
        } else {
            onBuy(property);
        }
    };

    // Function to show the next image in the gallery
    const showNextImage = () => {
        if (visibleImages < property.additionalImages.length - 3) {
            setVisibleImages(visibleImages + 1);
        }
    };

    // Function to show the previous image in the gallery
    const showPreviousImage = () => {
        if (visibleImages > 0) {
            setVisibleImages(visibleImages - 1);
        }
    };

    const openLightbox = (imgSrc) => {
        setLightboxImage(imgSrc);
    };

    const closeLightbox = () => {
        setLightboxImage(null);
    };

    // Format price using toLocaleString()
    const formattedPrice = `$${parseInt(property.price, 10).toLocaleString()}`;

    // Construct image URLs for main and additional images, with fallback to an empty array
    const mainImageUrl = property.mainImage ? `https://test-backend-d88x.onrender.com/uploads/${property.mainImage}` : ''; // Main image URL from your server
    const additionalImageUrls = (property.additionalImages || []).map(image => `https://test-backend-d88x.onrender.com/uploads/${image}`);

    return (
        <div className="property-details-page">
            <h1 className="property-title">{property.title}</h1>
            <div className="details-container">
                {mainImageUrl ? (
                    <img src={mainImageUrl} alt={property.title} className="main-image" />
                ) : (
                    <p>No main image available</p>
                )}

                {additionalImageUrls.length > 0 && (
                    <div className="image-gallery">
                        {additionalImageUrls.length > 3 && (
                            <button className="nav-button" onClick={showPreviousImage} disabled={visibleImages === 0}>
                                &uarr;
                            </button>
                        )}
                        <div className="gallery-images">
                            {additionalImageUrls.slice(visibleImages, visibleImages + 3).map((imgSrc, index) => (
                                <img 
                                    key={index} 
                                    src={imgSrc} 
                                    alt={`${property.title} - ${index + 1}`} 
                                    className="gallery-image"
                                    onClick={() => openLightbox(imgSrc)}
                                />
                            ))}
                        </div>
                        {additionalImageUrls.length > 3 && (
                            <button className="nav-button" onClick={showNextImage} disabled={visibleImages >= additionalImageUrls.length - 3}>
                                &darr;
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="property-info">
                <p><strong>Price:</strong> {formattedPrice}</p> {/* Formatted price */}
                <p><strong>Address:</strong> {property.address}</p>
                <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                <p><strong>Square Footage:</strong> {property.squareFootage} sq ft</p>
                <p><strong>Description:</strong> {property.description}</p>
            </div>
            <button className="buy-button" onClick={handleBuyNow}>Buy Now</button>

            {lightboxImage && (
                <div className="lightbox" onClick={closeLightbox}>
                    <img src={lightboxImage} alt="Enlarged view" className="lightbox-image" />
                </div>
            )}
        </div>
    );
}

export default PropertyDetails;