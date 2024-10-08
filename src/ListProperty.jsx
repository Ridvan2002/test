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
        mainImage: null,  // Main image file
        additionalImages: []  // Additional image files
    });
    const [displayPrice, setDisplayPrice] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            if (name === 'mainImage') {
                setFormData({ ...formData, mainImage: files[0] });  // Set main image
            } else if (name === 'additionalImages') {
                setFormData({ ...formData, additionalImages: Array.from(files) });  // Set additional images
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

    // Function to get a pre-signed URL from the backend
    const getPresignedUrl = async (file) => {
        try {
            const response = await fetch('https://test-backend-d88x.onrender.com/api/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName: file.name, fileType: file.type })
            });

            const data = await response.json();
            return data.url;  // Pre-signed URL from backend
        } catch (error) {
            console.error('Error generating pre-signed URL:', error);
            throw error;
        }
    };

    // Function to upload a file to S3 using the pre-signed URL
    const uploadToS3 = async (file, presignedUrl) => {
        try {
            await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });
            console.log('Uploaded to S3:', file.name);
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Step 1: Upload Main Image to S3
            let mainImageUrl = '';
            if (formData.mainImage) {
                const presignedUrl = await getPresignedUrl(formData.mainImage);
                await uploadToS3(formData.mainImage, presignedUrl);
                mainImageUrl = presignedUrl.split('?')[0];  // Get URL without query params
            }

            // Step 2: Upload Additional Images to S3
            const additionalImagesUrls = [];
            for (const file of formData.additionalImages) {
                const presignedUrl = await getPresignedUrl(file);
                await uploadToS3(file, presignedUrl);
                additionalImagesUrls.push(presignedUrl.split('?')[0]);  // Get URL without query params
            }

            // Step 3: Send property data and image URLs to the backend
            const listingData = {
                title: `${formData.bedrooms} Bedroom ${formData.propertyType}`,
                description: formData.description,
                price: formData.price,
                address: formData.address,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                squareFootage: formData.squareFootage,
                mainImage: mainImageUrl,
                additionalImages: additionalImagesUrls
            };

            const response = await fetch('https://test-backend-d88x.onrender.com/api/listings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(listingData)
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
                {/* Form fields for property details */}
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
                {/* More form fields */}
                <div>
                    <label>Upload Main Image:</label>
                    <input type="file" name="mainImage" onChange={handleChange} />
                </div>
                <div>
                    <label>Upload Additional Images:</label>
                    <input type="file" name="additionalImages" multiple onChange={handleChange} />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default ListProperty;
