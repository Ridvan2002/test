import React, { useState } from 'react';
import './styles/ListProperty.css';
import { useNavigate } from 'react-router-dom';

function ListProperty({ addListing }) { 
    const [formData, setFormData] = useState({
        address: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        price: '',
        description: '',
        mainImage: null, // Main image file
        additionalImages: [] // Additional image files
    });
    const [displayPrice, setDisplayPrice] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            if (name === 'mainImage') {
                setFormData({ ...formData, [name]: files[0] }); // Set main image
            } else if (name === 'additionalImages') {
                setFormData({ ...formData, [name]: Array.from(files) }); // Set additional images
            }
        } else if (name === 'price') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, price: numericValue });
            setDisplayPrice(formatPrice(numericValue));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const formatPrice = (value) => {
        if (!value) return '';
        return `$${parseInt(value, 10).toLocaleString()}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Create a FormData object to handle file uploads (main image + additional images)
        const formDataToSend = new FormData();
        const title = `${formData.bedrooms} Bedroom ${formData.propertyType}`;
        
        // Append form data for property details
        formDataToSend.append('title', title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('address', formData.address);
        formDataToSend.append('bedrooms', formData.bedrooms);
        formDataToSend.append('bathrooms', formData.bathrooms);
        formDataToSend.append('squareFootage', formData.squareFootage);
        
        // Append the main image file
        if (formData.mainImage) {
            formDataToSend.append('mainImage', formData.mainImage);
        }

        // Append additional image files
        formData.additionalImages.forEach((file) => {
            formDataToSend.append('additionalImages', file);
        });

        try {
            // Fetch request to the server (server.js) to handle file upload and store data in JSON
            const response = await fetch('https://test-backend-d88x.onrender.com/api/listings', {
                method: 'POST',
                body: formDataToSend,
            });

            if (response.status === 201) {
                // Trigger listing update after submission
                addListing();
                window.alert('Listing submitted successfully!');
                navigate('/'); // Redirect to Home after submission
            } else {
                window.alert('Failed to submit the listing.');
            }
        } catch (error) {
            console.error('Error creating listing:', error);
            window.alert('Error creating the listing.');
        }
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
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Upload Additional Images:</label>
                    <input
                        type="file"
                        name="additionalImages"
                        multiple
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default ListProperty;
