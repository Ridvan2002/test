import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

function Buy() {
  const location = useLocation();
  const property = location.state?.property;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    deposit: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [submitted, setSubmitted] = useState(false);

  if (!property) {
    return <p>Property details not found.</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="purchase-confirmation-container">
      <div className="purchase-confirmation">
        <h1>Thank You for Your Interest!</h1>
        <p>We’re excited that you’re interested in purchasing this property. A representative will contact you soon to assist with the next steps.</p>
        
        <h2>Property Details</h2>
        <p><strong>Address:</strong> {property.address}</p>
        <p><strong>Price:</strong> {property.price}</p>
        <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
        <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
        <p><strong>Square Footage:</strong> {property.squareFootage} sqft</p>
        
        <h2>Make a Deposit</h2>
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '400px', margin: '0 auto' }}>
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="phone">Phone Number:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="deposit">Deposit Amount ($):</label>
            <input
              type="number"
              id="deposit"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              required
              min="1000"
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="cardNumber">Credit Card Number:</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              required
              pattern="\d{16}"
              placeholder="1234 5678 9012 3456"
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="expiryDate">Expiry Date (MM/YY):</label>
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              pattern="\d{2}/\d{2}"
              placeholder="MM/YY"
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <label htmlFor="cvv">CVV:</label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              required
              pattern="\d{3}"
              placeholder="123"
              style={{ padding: '8px', fontSize: '16px' }}
            />

            <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#0077b5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>
              Submit Deposit
            </button>
          </form>
        ) : (
          <p>Thank you for submitting your deposit of ${formData.deposit}. We will process your payment and contact you shortly.</p>
        )}

        <h2>Contact Us</h2>
        <p>If you have any questions, please feel free to contact us at:</p>
        <p>Email: support@realestate.com</p>
        <p>Phone: (123) 456-7890</p>
      </div>
    </div>
  );
}

export default Buy;
