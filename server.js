const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // Import the specific clients
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // Add fallback region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer to upload files to S3 using AWS SDK v3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'test-listing-image', // Hardcoded S3 bucket name
    acl: 'public-read', // Make the uploaded files publicly readable
    key: function (req, file, cb) {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName); // The name of the file to be saved in S3
    },
  }),
});

// Helper function to read JSON data
const readJsonFile = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    throw new Error(`Could not read ${file}`);
  }
};

// Helper function to write JSON data
const writeJsonFile = async (file, data) => {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    throw new Error(`Could not write to ${file}`);
  }
};

// Insert listing with images uploading to S3
app.post('/api/listings', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, price, address, bedrooms, bathrooms, squareFootage } = req.body;

    const newListing = {
      id: uuidv4(),
      title,
      description,
      price,
      address,
      bedrooms,
      bathrooms,
      squareFootage,
      mainImage: req.files.mainImage ? req.files.mainImage[0].location : '', // S3 URL for main image
      additionalImages: req.files.additionalImages ? req.files.additionalImages.map(file => file.location) : [] // S3 URLs for additional images
    };

    // Save newListing to your listings JSON or database
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    listings.push(newListing);
    await writeJsonFile(path.join(__dirname, 'data', 'listings.json'), listings);

    res.status(201).json({ message: 'Listing and images created successfully', newListing });
  } catch (error) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Unable to create listing' });
  }
});

// Get listings and their associated images
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch listings' });
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readJsonFile(path.join(__dirname, 'data', 'users.json'));

    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), email, password: hashedPassword };
    users.push(newUser);

    await writeJsonFile(path.join(__dirname, 'data', 'users.json'), users);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Server error: Unable to register user' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readJsonFile(path.join(__dirname, 'data', 'users.json'));

    const user = users.find((user) => user.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({ userId: user.id, message: 'Login successful.' });
  } catch (error) {
    console.error('Error logging in user:', error.message);
    res.status(500).json({ message: 'Server error: Unable to login' });
  }
});

// Create Wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));

    wishlist.push({ userId, propertyId });
    await writeJsonFile(path.join(__dirname, 'data', 'wishlist.json'), wishlist);
    res.status(201).json({ message: 'Property added to wishlist.' });
  } catch (error) {
    console.error('Error adding to wishlist:', error.message);
    res.status(500).json({ message: 'Server error: Unable to add to wishlist' });
  }
});

// Remove from Wishlist
app.delete('/api/wishlist', async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));

    const updatedWishlist = wishlist.filter(item => !(item.userId === userId && item.propertyId === propertyId));

    await writeJsonFile(path.join(__dirname, 'data', 'wishlist.json'), updatedWishlist);
    res.status(200).json({ message: 'Property removed from wishlist.' });
  } catch (error) {
    console.error('Error removing from wishlist:', error.message);
    res.status(500).json({ message: 'Server error: Unable to remove from wishlist' });
  }
});

// Fetch Wishlist
app.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));

    const userWishlist = wishlist.filter((item) => item.userId === parseInt(userId));
    const userListings = userWishlist.map((item) => listings.find((listing) => listing.id === item.propertyId));

    res.json(userListings);
  } catch (error) {
    console.error('Error fetching wishlist:', error.message);
    res.status(500).json({ message: 'Server error: Unable to fetch wishlist' });
  }
});

// Use dynamic port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
