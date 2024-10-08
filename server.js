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

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // Add fallback region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer for file uploads (locally, before sending to S3)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory before uploading to S3
});

// Helper function to upload file to S3
const uploadToS3 = async (file, bucketName, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make the file publicly readable
    });

    await s3Client.send(command);
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw err;
  }
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

// Insert listing with images uploading to S3
app.post(
  '/api/listings',
  upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 10 }]),
  async (req, res) => {
    try {
      const { title, description, price, address, bedrooms, bathrooms, squareFootage } = req.body;
      
      // Upload main image
      let mainImageUrl = '';
      if (req.files.mainImage) {
        const mainImageKey = `${uuidv4()}${path.extname(req.files.mainImage[0].originalname)}`;
        mainImageUrl = await uploadToS3(req.files.mainImage[0], 'test-listing-image', mainImageKey);
      }

      // Upload additional images
      const additionalImagesUrls = [];
      if (req.files.additionalImages) {
        for (const file of req.files.additionalImages) {
          const additionalImageKey = `${uuidv4()}${path.extname(file.originalname)}`;
          const imageUrl = await uploadToS3(file, 'test-listing-image', additionalImageKey);
          additionalImagesUrls.push(imageUrl);
        }
      }

      const newListing = {
        id: uuidv4(),
        title,
        description,
        price,
        address,
        bedrooms,
        bathrooms,
        squareFootage,
        mainImage: mainImageUrl, // S3 URL for main image
        additionalImages: additionalImagesUrls, // S3 URLs for additional images
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
  }
);

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

// Use dynamic port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
