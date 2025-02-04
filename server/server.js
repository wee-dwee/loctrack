const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express(); // Initialize 'app' before using it

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Any request that doesn't match an API route will be handled by React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Create the express app
const port = 5002;

// MongoDB connection URI
const mongoURI = 'mongodb+srv://dweejpandya:xA-iCNw3PKUTtw6@cluster0.prz5r.mongodb.net/';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Middleware

// Allow requests from your frontend
app.use(cors({
  origin: 'https://loctrack-1-6rsu.onrender.com', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Schema to store family member locations
const locationSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', locationSchema);

// Function to decode Base64-encoded data
const decodeData = (encodedData) => {
  const decodedData = Buffer.from(encodedData, 'base64').toString();  // Decode Base64
  const [latitude, longitude] = decodedData.split(',');
  return { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
};

// Endpoint to receive location updates
app.post('/api/location', async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).send('Missing location data');
  }

  // Convert the name to uppercase
  const upperCaseName = name.toUpperCase();

  // Decode the location data
  const { latitude, longitude } = decodeData(location);

  try {
    // Use findOneAndUpdate with upsert: true to avoid duplicate entries
    const updatedLocation = await Location.findOneAndUpdate(
      { name: upperCaseName },  // Find by uppercase name
      { latitude, longitude, timestamp: new Date() }, // Update the location
      { upsert: true, new: true } // If not found, create a new entry
    );

    res.status(200).send('Location updated');
  } catch (err) {
    res.status(500).send('Error saving location');
  }
});

// Endpoint to get the latest location of all family members
app.get('/api/locations', (req, res) => {
  Location.find().sort({ timestamp: -1 }) // Sort by timestamp to get the most recent locations
    .then(locations => res.json(locations))
    .catch(err => res.status(500).send('Error retrieving locations'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
