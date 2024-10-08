const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK v3
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure AWS SDK v3 S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer to handle file uploads locally
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// Upload file to S3 using AWS SDK v3
const uploadToS3 = async (fileBuffer, fileName, fileMimeType) => {
  const uploadParams = {
    Bucket: 'test-listing-image', // Hardcoded S3 bucket name
    Key: fileName, // File name
    Body: fileBuffer, // File buffer
    ContentType: fileMimeType, // File type
    ACL: 'public-read', // Make the uploaded files publicly readable
  };

  try {
    const data = await s3.send(new PutObjectCommand(uploadParams));
    return `https://${uploadParams.Bucket}.s3.amazonaws.com/${fileName}`; // Return the public URL for the file
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw new Error('Error uploading file to S3');
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
      mainImage: '',
      additionalImages: [],
    };

    // Upload the main image if available
    if (req.files.mainImage && req.files.mainImage[0]) {
      const file = req.files.mainImage[0];
      newListing.mainImage = await uploadToS3(file.buffer, uuidv4() + path.extname(file.originalname), file.mimetype);
    }

    // Upload additional images if available
    if (req.files.additionalImages) {
      for (const file of req.files.additionalImages) {
        const imageUrl = await uploadToS3(file.buffer, uuidv4() + path.extname(file.originalname), file.mimetype);
        newListing.additionalImages.push(imageUrl);
      }
    }

    // Save the new listing in JSON
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
