const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// const db = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'Ridvan',
//   database: 'myrealestate',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
const db = mysql.createPool({
  host: 'therealestate.cja6csugogr6.us-east-2.rds.amazonaws.com', // Your RDS Endpoint
  user: 'Ridvan', // Your RDS username
  password: 'ridvan2002', // Your RDS password
  database: 'therealestate', // Your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


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
  const { title, description, price, address, bedrooms, bathrooms, squareFootage } = req.body;

  const sqlListing = `INSERT INTO listings (title, description, price, address, image, bedrooms, bathrooms, squareFootage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Insert the listing into the listings table
    const [result] = await connection.query(sqlListing, [title, description, price, address, '', bedrooms, bathrooms, squareFootage]);
    const listingId = result.insertId;

    // Process main image
    let mainImagePath = '';
    if (req.files.mainImage && req.files.mainImage.length > 0) {
      mainImagePath = `uploads/image${listingId}_main${path.extname(req.files.mainImage[0].originalname)}`;
      await fs.rename(req.files.mainImage[0].path, mainImagePath);
    }

    // Update the main image path in the listings table
    const updateMainImageSql = `UPDATE listings SET image = ? WHERE id = ?`;
    await connection.query(updateMainImageSql, [mainImagePath, listingId]);

    // Process additional images and insert them into the database
    if (req.files.additionalImages && req.files.additionalImages.length > 0) {
      const sqlImages = `INSERT INTO listing_images (listing_id, image_url) VALUES ?`;
      const imageValues = [];

      const sortedAdditionalImages = req.files.additionalImages.sort((a, b) => a.originalname.localeCompare(b.originalname));

      for (const [index, file] of sortedAdditionalImages.entries()) {
        const imageFileName = `uploads/image${listingId}_${index + 1}${path.extname(file.originalname)}`;
        await fs.rename(file.path, imageFileName);
        imageValues.push([listingId, imageFileName]);
      }

      await connection.query(sqlImages, [imageValues]);
    }

    await connection.commit();
    res.status(201).send('Listing and images created successfully');
  } catch (err) {
    await connection.rollback();
    console.error('Error creating listing:', err.message);
    res.status(500).send(`Server error: ${err.message}`);
  } finally {
    connection.release();
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Get listings and their associated images
app.get('/api/listings', async (req, res) => {
  const sql = `
    SELECT listings.*, GROUP_CONCAT(listing_images.image_url ORDER BY listing_images.image_url) AS additionalImages
    FROM listings
    LEFT JOIN listing_images ON listings.id = listing_images.listing_id
    GROUP BY listings.id
  `;

  try {
    const [results] = await db.query(sql);
    res.json(results.map((row) => ({
      ...row,
      additionalImages: row.additionalImages ? row.additionalImages.split(',') : [],
    })));
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).send('Server error');
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const connection = await db.getConnection();
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    await connection.query(sql, [email, hashedPassword]);
    connection.release();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Error registering user:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await db.getConnection();
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [users] = await connection.query(sql, [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({ userId: user.id, message: 'Login successful.' });
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Create Wishlist
app.post('/api/wishlist', async (req, res) => {
  const { userId, propertyId } = req.body;

  const sql = 'INSERT INTO wishlist (user_id, property_id) VALUES (?, ?)';
  try {
    const connection = await db.getConnection();
    await connection.query(sql, [userId, propertyId]);
    connection.release();
    res.status(201).json({ message: 'Property added to wishlist.' });
  } catch (err) {
    console.error('Error adding to wishlist:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Fetch Wishlist
app.get('/api/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT listings.*, GROUP_CONCAT(listing_images.image_url ORDER BY listing_images.image_url) AS additionalImages
    FROM wishlist
    JOIN listings ON wishlist.property_id = listings.id
    LEFT JOIN listing_images ON listings.id = listing_images.listing_id
    WHERE wishlist.user_id = ?
    GROUP BY listings.id
  `;

  try {
    const connection = await db.getConnection();
    const [wishlistItems] = await connection.query(sql, [userId]);
    connection.release();
    res.json(wishlistItems.map((row) => ({
      ...row,
      additionalImages: row.additionalImages ? row.additionalImages.split(',') : [],
    })));
  } catch (err) {
    console.error('Error fetching wishlist:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Remove from Wishlist
app.delete('/api/wishlist', async (req, res) => {
  const { userId, propertyId } = req.body;

  const sql = 'DELETE FROM wishlist WHERE user_id = ? AND property_id = ?';
  try {
    const connection = await db.getConnection();
    await connection.query(sql, [userId, propertyId]);
    connection.release();
    res.status(200).json({ message: 'Property removed from wishlist.' });
  } catch (err) {
    console.error('Error removing from wishlist:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
