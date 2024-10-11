const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const multer = require('multer');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

const readJsonFile = async (file) => {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
};

const writeJsonFile = async (file, data) => {
    try {
        await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing to ${file}:`, error);
    }
};

app.post('/api/wishlist', async (req, res) => {
    const { userId, id } = req.body;

    if (!userId || !id) {
        return res.status(400).json({ message: 'Missing userId or property id' });
    }

    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));

    const existingWishlistItem = wishlist.find(item => item.userId === userId && item.id === id);

    if (existingWishlistItem) {
        return res.status(200).json({ message: 'Property already in wishlist' });
    }

    wishlist.push({ userId, id });
    await writeJsonFile(path.join(__dirname, 'data', 'wishlist.json'), wishlist);

    res.status(201).json({ message: 'Added to wishlist' });
});

app.get('/api/wishlist/:userId', async (req, res) => {
    const { userId } = req.params;

    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));
    const properties = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));

    const userWishlist = wishlist.filter(item => item.userId === userId);
    const wishlistProperties = properties.filter(property =>
        userWishlist.some(item => item.id === property.id)
    );

    res.status(200).json(wishlistProperties);
});

app.delete('/api/wishlist', async (req, res) => {
    const { userId, id } = req.body;

    const wishlist = await readJsonFile(path.join(__dirname, 'data', 'wishlist.json'));

    const updatedWishlist = wishlist.filter(item => !(item.userId === userId && item.id === id));

    await writeJsonFile(path.join(__dirname, 'data', 'wishlist.json'), updatedWishlist);

    res.status(200).json({ message: 'Property removed from wishlist' });
});

app.post('/api/listings', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]), async (req, res) => {
    try {
        console.log("Received form data:", req.body);
        console.log("Received files:", req.files);

        const { description, price, address, bedrooms, bathrooms, squareFootage, propertyType } = req.body;

        if (!description || !price || !address || !bathrooms || !squareFootage || !propertyType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
        const listingCount = listings.length + 1;

        let mainImageFilename = null;
        if (req.files.mainImage) {
            mainImageFilename = `image${listingCount}.jpg`;
            await fs.rename(req.files.mainImage[0].path, path.join(__dirname, 'uploads', mainImageFilename));
        }

        const additionalImageFilenames = [];
        if (req.files.additionalImages) {
            for (let i = 0; i < req.files.additionalImages.length; i++) {
                const file = req.files.additionalImages[i];
                const newFilename = `image${listingCount}_${i + 1}.jpg`;
                additionalImageFilenames.push(newFilename);
                await fs.rename(file.path, path.join(__dirname, 'uploads', newFilename));
            }
        }

        const title = `${bedrooms}-bedroom ${propertyType}`;

        const newListing = {
            id: uuidv4(),
            title,
            description,
            price,
            address,
            bedrooms,
            bathrooms,
            squareFootage,
            mainImage: mainImageFilename ? `/uploads/${mainImageFilename}` : null,
            additionalImages: additionalImageFilenames.map(file => `/uploads/${file}`),
        };

        listings.push(newListing);
        await writeJsonFile(path.join(__dirname, 'data', 'listings.json'), listings);

        res.status(201).json({ message: 'Listing created successfully', newListing });
    } catch (error) {
        console.error('Error creating listing:', error.message);
        res.status(500).json({ message: 'Server error: Unable to create listing' });
    }
});

app.get('/api/properties', async (req, res) => {
    try {
        const { ids } = req.query;
        const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
        const filteredProperties = listings.filter(property => ids.split(',').includes(property.id));
        res.status(200).json(filteredProperties);
    } catch (error) {
        console.error('Error fetching properties:', error.message);
        res.status(500).json({ message: 'Server error: Unable to fetch properties' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readJsonFile(path.join(__dirname, 'data', 'users.json'));

        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ message: 'Server error: Unable to login' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readJsonFile(path.join(__dirname, 'data', 'users.json'));

        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            email,
            password: hashedPassword
        };

        users.push(newUser);
        await writeJsonFile(path.join(__dirname, 'data', 'users.json'), users);

        res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(500).json({ message: 'Server error: Unable to register user' });
    }
});

app.use('/uploads', express.static('uploads'));

app.get('/api/listings', async (req, res) => {
    try {
        const listings = await readJsonFile(path.join(__dirname, 'data', 'listings.json'));
        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching listings:', error.message);
        res.status(500).json({ message: 'Server error: Unable to fetch listings' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});