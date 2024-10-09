const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const multer = require('multer');

// Configure Multer for file uploads (storing files in 'uploads' directory)
const upload = multer({ dest: 'uploads/' }); // Files will be saved in the 'uploads/' folder

const app = express();
app.use(cors()); // You can still use cors
// DO NOT use bodyParser.json() for multipart routes

// Helper functions to read and write JSON files
const readJsonFile = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    throw new Error(`Could not read ${file}`);
  }
};

const writeJsonFile = async (file, data) => {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    throw new Error(`Could not write to ${file}`);
  }
};

app.post('/api/listings', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 5 }]), async (req, res) => {
  try {
    // Log received form data and files
    console.log("Received form data:", req.body);
    console.log("Received files:", req.files);

    const { title, description, price, address, bedrooms, bathrooms, squareFootage } = req.body;

    // Check for undefined fields
    if (!title || !description || !price || !address || !bedrooms || !bathrooms || !squareFootage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle uploaded images
    const mainImage = req.files.mainImage ? req.files.mainImage[0].filename : null;
    const additionalImages = req.files.additionalImages ? req.files.additionalImages.map(file => file.filename) : [];

    // Construct the new listing object
    const newListing = {
      id: uuidv4(),
      title,
      description,
      price,
      address,
      bedrooms,
      bathrooms,
      squareFootage,
      mainImage: mainImage ? `/uploads/${mainImage}` : null, // Construct the main image URL
      additionalImages: additionalImages.map(file => `/uploads/${file}`), // Construct the URLs for additional images
    };

    console.log('New listing:', newListing);

    // Read the existing listings
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    listings.push(newListing);

    await writeJsonFile(path.join(__dirname, 'data', 'listings.json'), listings);

    console.log('Updated listings:', listings);

    res.status(201).json({ message: 'Listing created successfully', newListing });
  } catch (error) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Unable to create listing' });
  }
});

// Route to serve uploaded images
app.use('/uploads', express.static('uploads'));

// GET route to fetch all listings
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Server error: Unable to fetch listings' });
  }
});

// Use dynamic port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});