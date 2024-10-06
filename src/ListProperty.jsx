import React, { useState } from 'react';
import './styles/ListProperty.css';
import { useNavigate } from 'react-router-dom';
import api from './utils/api';

function ListProperty({ addListing }) { 
    const [formData, setFormData] = useState({
        address: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        price: '',
        description: '',
        mainImage: null,
        additionalImages: []
    });
    const [displayPrice, setDisplayPrice] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            if (name === 'mainImage') {
                setFormData({ ...formData, [name]: files[0] });
            } else if (name === 'additionalImages') {
                setFormData({ ...formData, [name]: Array.from(files) });
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
        const title = `${formData.bedrooms} Bedroom ${formData.propertyType}`;
        const newListingData = new FormData();
        newListingData.append('title', title);
        newListingData.append('description', formData.description);
        newListingData.append('price', formData.price);
        newListingData.append('address', formData.address);
        newListingData.append('bedrooms', formData.bedrooms);
        newListingData.append('bathrooms', formData.bathrooms);
        newListingData.append('squareFootage', formData.squareFootage);
        if (formData.mainImage) {
            newListingData.append('mainImage', formData.mainImage);
        }
        formData.additionalImages.forEach((file) => {
            newListingData.append('additionalImages', file);
        });

        try {
            const response = await api.post('/listings', newListingData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 201) {
                addListing(response.data); // Immediately update listings after submitting
                window.alert('Listing submitted successfully!');
                navigate('/'); // Redirect to Home after submission
            }
        } catch (error) {
            console.error('Error creating listing:', error);
            window.alert('Failed to create the listing.');
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
                        placeholder="3624 Brookeview Street, Atlanta, GA 30336"
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
