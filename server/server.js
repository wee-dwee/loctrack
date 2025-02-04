const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5002;  // Dynamic port for deployment

// ✅ Enable CORS for frontend
app.use(cors({
  origin: 'https://loctrack-1-6rsu.onrender.com', // Update with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());  // ✅ JSON middleware

// ✅ MongoDB Connection
const mongoURI = 'mongodb+srv://dweejpandya:xA-iCNw3PKUTtw6@cluster0.prz5r.mongodb.net/';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Schema and Model for storing locations
const locationSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});
const Location = mongoose.model('Location', locationSchema);

// ✅ Decode Base64 location data
const decodeData = (encodedData) => {
  try {
    const decodedData = Buffer.from(encodedData, 'base64').toString();
    const [latitude, longitude] = decodedData.split(',');
    return { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
  } catch (error) {
    return null;
  }
};

// ✅ API to receive location updates
app.post('/api/location', async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Missing location data' });

  const decodedLocation = decodeData(location);
  if (!decodedLocation) return res.status(400).json({ error: 'Invalid location format' });

  try {
    const updatedLocation = await Location.findOneAndUpdate(
      { name: name.toUpperCase() },
      { ...decodedLocation, timestamp: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Location updated', updatedLocation });
  } catch (err) {
    res.status(500).json({ error: 'Error saving location' });
  }
});

// ✅ API to get latest locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ timestamp: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving locations' });
  }
});

// // ✅ Serve frontend build files
// app.use(express.static(path.join(__dirname, '../client/build')));

// // ✅ Serve React app for unknown routes
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
// });

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
