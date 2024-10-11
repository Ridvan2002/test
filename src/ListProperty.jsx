import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ListProperty.css';

function ListProperty({ addListing }) {
    const [formData, setFormData] = useState({
        address: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        price: '',
        description: ''
    });
    const [mainImage, setMainImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [displayPrice, setDisplayPrice] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'price') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, price: numericValue });
            setDisplayPrice(formatPrice(numericValue));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleMainImageChange = (e) => {
        setMainImage(e.target.files[0]);
    };

    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
        setAdditionalImages(sortedFiles);
        console.log("Ordered additional images:", sortedFiles); 
    };
    
    const formatPrice = (value) => {
        if (!value) return '';
        return `$${parseInt(value, 10).toLocaleString()}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newListing = {
            id: Math.random().toString(36).substring(2, 15), // Generate a random ID
            address: formData.address,
            propertyType: formData.propertyType,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            squareFootage: formData.squareFootage,
            price: formData.price,
            description: formData.description,
            mainImage: mainImage ? URL.createObjectURL(mainImage) : null, // Store image URLs
            additionalImages: additionalImages.map(image => URL.createObjectURL(image))
        };

        // Fetch current listings from localStorage
        const storedListings = JSON.parse(localStorage.getItem('listings')) || [];
        storedListings.push(newListing);
        localStorage.setItem('listings', JSON.stringify(storedListings));

        addListing(); // Trigger re-fetch of listings in parent component
        window.alert('Listing submitted successfully!');
        navigate('/'); // Redirect to home
    };

    return (
        <div className="list-property-form">
            <h1>List Your Property</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Address:</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="1234 Main St, City, State"
                    />
                </div>
                <div className="form-row">
                    <div>
                        <label>Property Type:</label>
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                        >
                            <option value="">Select a property type</option>
                            <option value="House">House</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Condo">Condo</option>
                            <option value="Land">Land</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div>
                        <label>Bedrooms:</label>
                        <input
                            type="number"
                            name="bedrooms"
                            value={formData.bedrooms}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Bathrooms:</label>
                        <input
                            type="number"
                            name="bathrooms"
                            value={formData.bathrooms}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Square Footage:</label>
                        <input
                            type="text"
                            name="squareFootage"
                            value={formData.squareFootage}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label>Price:</label>
                    <input
                        type="text"
                        name="price"
                        value={displayPrice}
                        onChange={handleChange}
                        placeholder="$0"
                    />
                </div>

                <div>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div>
                    <label>Upload Main Image:</label>
                    <input
                        type="file"
                        name="mainImage"
                        onChange={handleMainImageChange}
                    />
                </div>

                <div>
                    <label>Upload Additional Images:</label>
                    <input
                        type="file"
                        name="additionalImages"
                        multiple
                        onChange={handleAdditionalImagesChange}
                    />
                </div>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default ListProperty;
