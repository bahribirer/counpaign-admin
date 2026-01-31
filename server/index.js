const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/counpaign', {
  // options if needed (mongoose 6+ defaults are usually fine)
})
  .then(() => {
    console.log('MongoDB Connected');
    console.log('Active Database:', mongoose.connection.name);
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes Placeholder
app.get('/', (req, res) => {
  res.send('Admin Panel API is running');
});

// Import Routes
const authRoutes = require('./routes/auth');
const firmsRoutes = require('./routes/firms');
const usersRoutes = require('./routes/users');
const campaignsRoutes = require('./routes/campaigns');

app.use('/api/auth', authRoutes);
app.use('/api/firms', firmsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
