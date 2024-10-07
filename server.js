const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const usersFile = path.join(__dirname, 'data', 'users.json');
const listingsFile = path.join(__dirname, 'data', 'listings.json');
const wishlistFile = path.join(__dirname, 'data', 'wishlist.json');

// Helper function to read JSON file
async function readJsonFile(file) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    throw new Error(`Could not read ${file}`);
  }
}

// Helper function to write to JSON file
async function writeJsonFile(file, data) {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    throw new Error(`Could not write to ${file}`);
  }
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// Insert listing with additional images
app.post('/api/listings', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 10 }]), async (req, res) => {
  try {
    const { title, description, price, address, bedrooms, bathrooms, squareFootage } = req.body;
    const listings = await readJsonFile(listingsFile);

    const listingId = listings.length + 1;
    let mainImagePath = '';

    if (req.files.mainImage && req.files.mainImage.length > 0) {
      mainImagePath = `uploads/image${listingId}_main${path.extname(req.files.mainImage[0].originalname)}`;
      await fs.rename(req.files.mainImage[0].path, mainImagePath);
    }

    const newListing = {
      id: listingId,
      title,
      description,
      price,
      address,
      image: mainImagePath,
      bedrooms,
      bathrooms,
      squareFootage,
      additionalImages: [],
    };

    if (req.files.additionalImages && req.files.additionalImages.length > 0) {
      for (const [index, file] of req.files.additionalImages.entries()) {
        const imageFileName = `uploads/image${listingId}_${index + 1}${path.extname(file.originalname)}`;
        await fs.rename(file.path, imageFileName);
        newListing.additionalImages.push(imageFileName);
      }
    }

    listings.push(newListing);
    await writeJsonFile(listingsFile, listings);
    res.status(201).json({ message: 'Listing and images created successfully' });
  } catch (error) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Unable to create listing' });
  }
});

// Get listings and their associated images
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await readJsonFile(listingsFile);
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
    const users = await readJsonFile(usersFile);

    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, password: hashedPassword };
    users.push(newUser);

    await writeJsonFile(usersFile, users);
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
    const users = await readJsonFile(usersFile);

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
    const wishlist = await readJsonFile(wishlistFile);

    wishlist.push({ userId, propertyId });
    await writeJsonFile(wishlistFile, wishlist);
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
    const wishlist = await readJsonFile(wishlistFile);

    const updatedWishlist = wishlist.filter(item => !(item.userId === userId && item.propertyId === propertyId));

    await writeJsonFile(wishlistFile, updatedWishlist);
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
    const wishlist = await readJsonFile(wishlistFile);
    const listings = await readJsonFile(listingsFile);

    const userWishlist = wishlist.filter((item) => item.userId === parseInt(userId));
    const userListings = userWishlist.map((item) => listings.find((listing) => listing.id === item.propertyId));

    res.json(userListings);
  } catch (error) {
    console.error('Error fetching wishlist:', error.message);
    res.status(500).json({ message: 'Server error: Unable to fetch wishlist' });
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use dynamic port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
