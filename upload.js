const { MongoClient } = require('mongodb');
const fs = require('fs');

async function run() {
  const uri = process.env.MONGO_URI; // put your Atlas URI in env
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("recipes_db");
    const col = db.collection("recipes");

    // read cleaned data
    const recipes = JSON.parse(fs.readFileSync("recipes_clean.json", "utf8"));

    // clear old data
    await col.deleteMany({});
    console.log("Old data cleared.");

    // insert new data
    const result = await col.insertMany(recipes);
    console.log(`✅ Inserted ${result.insertedCount} recipes`);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
