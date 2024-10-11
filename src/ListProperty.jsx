import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ListProperty.css';
import api from './utils/api';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formDataToSend = new FormData();
        formDataToSend.append('address', formData.address);
        formDataToSend.append('propertyType', formData.propertyType);
        formDataToSend.append('bedrooms', formData.bedrooms);
        formDataToSend.append('bathrooms', formData.bathrooms);
        formDataToSend.append('squareFootage', formData.squareFootage);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('description', formData.description);

        if (mainImage) {
            formDataToSend.append('mainImage', mainImage);
        }
        additionalImages.forEach(file => {
            formDataToSend.append('additionalImages', file);
        });

        try {
            const response = await api.post('/listings', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                addListing();
                window.alert('Listing submitted successfully!');
                navigate('/');
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