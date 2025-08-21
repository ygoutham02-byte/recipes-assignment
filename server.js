// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

let db;

// Connect to MongoDB
async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db("recipes_db");
  console.log("✅ Connected to MongoDB Atlas");
}
connectDB().catch(err => console.error(err));

// Middleware
app.use(express.json());
app.use(require('cors')());

// Route 1: Get all recipes (paginated, sorted by rating)
app.get('/api/recipes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const col = db.collection('recipes');
    const total = await col.countDocuments();
    const recipes = await col.find()
      .sort({ rating: -1 })  // highest rating first
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({ page, limit, total, data: recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 2: Search recipes
app.get('/api/recipes/search', async (req, res) => {
  try {
    const query = {};

    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: "i" }; // case-insensitive
    }
    if (req.query.cuisine) {
      query.cuisine = req.query.cuisine;
    }
    if (req.query.rating) {
      const m = req.query.rating.match(/(<=|>=|=|<|>)(.+)/);
      if (m) {
        const opMap = { '<=': '$lte', '>=': '$gte', '<': '$lt', '>': '$gt', '=': '$eq' };
        query.rating = { [opMap[m[1]]]: parseFloat(m[2]) };
      }
    }
    if (req.query.total_time) {
      const t = parseInt(req.query.total_time);
      if (!isNaN(t)) query.total_time = { $lte: t };
    }
    if (req.query.calories) {
      const m = req.query.calories.match(/(<=|>=|=|<|>)(.+)/);
      if (m) {
        const opMap = { '<=': '$lte', '>=': '$gte', '<': '$lt', '>': '$gt', '=': '$eq' };
        query['nutrients.calories'] = { [opMap[m[1]]]: parseFloat(m[2]) };
      }
    }

    const col = db.collection('recipes');
    const recipes = await col.find(query).limit(50).toArray(); // limit to 50 results
    res.json({ data: recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
