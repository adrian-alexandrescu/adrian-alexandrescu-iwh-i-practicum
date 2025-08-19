// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

const HS_TOKEN = process.env.HS_PRIVATE_APP_TOKEN;
const HS_OBJECT_TYPE = process.env.HS_OBJECT_TYPE; // e.g., "2-1234567" or fullyQualifiedName
const HS_PROPERTIES = process.env.HS_PROPERTIES || 'name,bio,favorite_thing';
const PORT = process.env.PORT || 3000;

if (!HS_TOKEN || !HS_OBJECT_TYPE) {
  console.error('Missing HS_PRIVATE_APP_TOKEN or HS_OBJECT_TYPE in .env');
  process.exit(1);
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));

// 1) Homepage: list records
app.get('/', async (req, res) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/${HS_OBJECT_TYPE}`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${HS_TOKEN}` },
      params: {
        properties: HS_PROPERTIES, // comma-separated
        limit: 100,
        archived: false
      }
    });
    const rows = resp.data.results || [];
    res.render('homepage', { rows, title: 'Custom Objects' });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error fetching records');
  }
});

// 2) Form page
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});

// 3) Form POST -> create record -> redirect home
app.post('/update-cobj', async (req, res) => {
  try {
    // Make sure these names match your property *internal* names
    const { name, bio, favorite_thing } = req.body;

    const url = `https://api.hubapi.com/crm/v3/objects/${HS_OBJECT_TYPE}`;
    await axios.post(
      url,
      {
        properties: {
          name,
          bio,
          favorite_thing
        }
      },
      { headers: { Authorization: `Bearer ${HS_TOKEN}` } }
    );
    res.redirect('/');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error creating record');
  }
});

app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
});
