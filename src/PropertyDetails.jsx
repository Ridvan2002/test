import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './styles/PropertyDetails.css';

function PropertyDetails({ listings, handleOpenAuthModal, onBuy, basePath }) {
    const { id } = useParams();
    const property = listings.find((listing) => listing.id === id);
    
    const { isLoggedIn } = useAuth();
    const [visibleImages, setVisibleImages] = useState(0);
    const [lightboxImage, setLightboxImage] = useState(null);

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

    const showNextImage = () => {
        if (visibleImages < property.additionalImages.length - 3) {
            setVisibleImages(visibleImages + 1);
        }
    };

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

    const formattedPrice = `$${parseInt(property.price, 10).toLocaleString()}`;

    // Update main image with basePath from the public/uploads directory
    const mainImageUrl = property.mainImage ? `${basePath}${property.mainImage}` : '';

    // Update additional images with relative paths from the public/uploads directory
    const additionalImageUrls = (property.additionalImages || []).map(image => `${basePath}/uploads/${image}`);


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
                <p><strong>Price:</strong> {formattedPrice}</p>
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
