const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner'); // Add this for presigned URLs

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure AWS SDK v3 S3Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to generate pre-signed URL
const generatePresignedUrl = async (fileName, fileType) => {
  const params = {
    Bucket: 'test-listing-image',
    Key: fileName,
    ContentType: fileType,
    ACL: 'public-read',  // Optional, sets file to be publicly readable
  };

  const command = new PutObjectCommand(params);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL valid for 1 hour
  return url;
};

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

// Route for generating pre-signed URLs for image upload
app.post('/api/upload-url', async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const uniqueFileName = `${uuidv4()}${path.extname(fileName)}`; // Create a unique name for the file
    const url = await generatePresignedUrl(uniqueFileName, fileType);

    res.status(200).json({ url, fileName: uniqueFileName });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error.message);
    res.status(500).json({ message: 'Server error: Unable to generate pre-signed URL' });
  }
});

// Insert listing with image URLs (no direct uploads here, use pre-signed URLs)
app.post('/api/listings', async (req, res) => {
  try {
    const { title, description, price, address, bedrooms, bathrooms, squareFootage, mainImage, additionalImages } = req.body;

    const newListing = {
      id: uuidv4(),
      title,
      description,
      price,
      address,
      bedrooms,
      bathrooms,
      squareFootage,
      mainImage,  // URL returned from S3 pre-signed upload
      additionalImages // Array of S3 URLs
    };

    // Save newListing to your listings JSON or database
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    listings.push(newListing);
    await writeJsonFile(path.join(__dirname, 'data', 'listings.json'), listings);

    res.status(201).json({ message: 'Listing created successfully', newListing });
  } catch (error) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Unable to create listing' });
  }
});

// **GET route to fetch all listings**
app.get('/api/listings', async (req, res) => {
  try {
    // Read listings from the JSON file (or database)
    const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
    res.status(200).json(listings);  // Respond with the listings in JSON format
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Server error: Unable to fetch listings' });
  }
});

// User Registration (remains the same)
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

// User Login (remains the same)
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

// Use dynamic port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
