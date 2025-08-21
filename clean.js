// clean.js
const fs = require('fs');

// 1. Read the JSON file
let raw = fs.readFileSync('US_recipes.json', 'utf8');

// 2. Parse JSON (handle NaN if any unquoted)
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  // replace NaN with null if parsing fails
  raw = raw.replace(/:\s*NaN(?=[,\r\n}])/g, ': null');
  data = JSON.parse(raw);
}

// 3. Convert object → array if needed
let recipes = Array.isArray(data) ? data : Object.values(data);

// 4. Clean numeric fields
function cleanNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    if (val.trim() === '' || val.toLowerCase() === 'nan') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  return null;
}

recipes.forEach(r => {
  ['rating', 'prep_time', 'cook_time', 'total_time'].forEach(field => {
    if (r[field] !== undefined) r[field] = cleanNumber(r[field]);
  });

  if (r.nutrients && typeof r.nutrients === 'object') {
    Object.keys(r.nutrients).forEach(n => {
      r.nutrients[n] = cleanNumber(r.nutrients[n]);
    });
  }
});

// 5. Save cleaned JSON to new file
fs.writeFileSync('recipes_clean.json', JSON.stringify(recipes, null, 2));

console.log(`✅ Cleaned ${recipes.length} recipes. Saved as recipes_clean.json`);
