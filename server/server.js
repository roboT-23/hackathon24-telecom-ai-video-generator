import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from "openai";
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

console.log('Server starting...');

// Middleware pre logovanie requestov
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  debug: true
});
db.query(`USE ${process.env.DB_DATABASE}`, (err) => {
  if (err) {
    console.error('Error selecting database:', err);
  } else {
    console.log(`Database ${process.env.DB_DATABASE} selected successfully.`);
  }
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});
app.get('/api/test2', (req, res) => {
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({
        error: 'Failed to fetch tables',
        details: err.message
      });
    }
    res.json(results);
  });
});
app.get('/api/testgpt', async (req, res) => {
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Say hello!',
      max_tokens: 5,
    });

    res.json({ message: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process GPT request' + error });
  }
});
// GET /api/videos endpoint
app.get('/api/videos', (req, res) => {
  console.log('Fetching videos...');

  const query = `
    SELECT
      id,
      title,
      status,
      created_at,
      updated_at,
      processing_time,
      error_message,
      file_path,
      file_size,
      duration,
      format
    FROM videos
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({
        error: 'Failed to fetch videos',
        details: err.message
      });
    }

    console.log(`Found ${results.length} videos`);
    res.json(results);
  });
});


// POST /api/ideas - Pridanie nového nápadu
app.post('/api/ideas', (req, res) => {
  const { name, description, type } = req.body;

  if (!name || !description || !type) {
    return res.status(400).send({ error: 'Chýbajú povinné údaje!' });
  }

  const sqlInsertIdea = `
    INSERT INTO ideas (name, description, type)
    VALUES (?, ?, ?)
  `;

  db.query(sqlInsertIdea, [name, description, type], (err, result) => {
    if (err) {
      console.error('Chyba pri ukladaní nápadu:', err);
      return res.status(500).send({ error: 'Chyba pri ukladaní!' });
    }

    res.status(201).send({ message: 'Nápad uložený úspešne!', id: result.insertId });
  });
});

// GET /api/ideas - Získanie všetkých nápadov
app.get('/api/ideas', (req, res) => {
  const sqlGetIdeas = `
    SELECT * FROM ideas
    ORDER BY created_at DESC
  `;

  db.query(sqlGetIdeas, (err, results) => {
    if (err) {
      console.error('Chyba pri získavaní nápadov:', err);
      return res.status(500).send({ error: 'Chyba pri získavaní dát!' });
    }

    res.status(200).send(results);
  });
});

// GET /api/ideas/:id - Získanie konkrétneho nápadu
app.get('/api/ideas/:id', (req, res) => {
  const { id } = req.params;

  const sqlGetIdeaById = `
    SELECT * FROM ideas WHERE id = ?
  `;

  db.query(sqlGetIdeaById, [id], (err, results) => {
    if (err) {
      console.error('Chyba pri získavaní nápadu:', err);
      return res.status(500).send({ error: 'Chyba pri získavaní dát!' });
    }

    if (results.length === 0) {
      return res.status(404).send({ error: 'Nápad nenájdený!' });
    }

    res.status(200).send(results[0]);
  });
});

// POST /api/prompts - Create a new prompt
// POST /api/prompts - Create a new prompt
app.post('/api/prompts', async (req, res) => {
  const { name, language, type, content, idea_id } = req.body;

  // Kontrola chýbajúcich povinných polí
  if (!name || !language || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields: name, language, type, content.' });
  }

  const sql = `
    INSERT INTO prompts (name, language, type, content, idea_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, language, type, content, idea_id || null], (err, result) => {
    if (err) {
      console.error('Error creating prompt:', err);
      return res.status(500).json({ error: 'Failed to create prompt' });
    }

    res.status(201).json({ message: 'Prompt created successfully', id: result.insertId });
  });
});

// GET /api/prompts - Get all prompts
// GET /api/prompts - Get all prompts
app.get('/api/prompts', async (req, res) => {
  const sql = `
    SELECT p.id, p.name, p.language, p.type, p.content, p.likes, p.dislikes, p.created_at,
           i.name AS idea_name
    FROM prompts p
    LEFT JOIN ideas i ON p.idea_id = i.id
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching prompts:', err);
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }

    res.status(200).json(results);
  });
});

// GET /api/prompts/:id - Get a single prompt by ID
// GET /api/prompts/:id - Get a single prompt by ID
app.get('/api/prompts/:id', async (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT p.id, p.name, p.language, p.type, p.content, p.likes, p.dislikes, p.created_at,
           i.name AS idea_name
    FROM prompts p
    LEFT JOIN ideas i ON p.idea_id = i.id
    WHERE p.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching prompt:', err);
      return res.status(500).json({ error: 'Failed to fetch prompt' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.status(200).json(results[0]);
  });
});

// PATCH /api/prompts/:id/like - Increment likes
// PATCH /api/prompts/:id/like - Increment likes
app.patch('/api/prompts/:id/like', async (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE prompts SET likes = likes + 1 WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error adding like:', err);
      return res.status(500).json({ error: 'Failed to add like' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.status(200).json({ message: 'Like added successfully' });
  });
});

// PATCH /api/prompts/:id/dislike - Increment dislikes
// PATCH /api/prompts/:id/dislike - Increment dislikes
app.patch('/api/prompts/:id/dislike', async (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE prompts SET dislikes = dislikes + 1 WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error adding dislike:', err);
      return res.status(500).json({ error: 'Failed to add dislike' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.status(200).json({ message: 'Dislike added successfully' });
  });
});



app.post('/api/wizards', async (req, res) => {
  const { idea_id, prompt_id } = req.body;

  if (!idea_id || !prompt_id) {
    return res.status(400).json({ error: 'idea_id and prompt_id are required' });
  }

  try {
    const [result] = await db.promise().execute(
      `INSERT INTO wizards (idea_id, prompt_id, status) VALUES (?, ?, 'pending')`,
      [idea_id, prompt_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Error saving wizard:', error);
    res.status(500).json({ error: 'Failed to save wizard' });
  }
});

app.get('/api/wizards', async (req, res) => {
  try {
    const [rows] = await db.promise().execute('SELECT * FROM wizards');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching wizards:', error);
    res.status(500).json({ error: 'Failed to fetch wizards' });
  }
})

app.get('/api/wizards/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch wizard details
    const [wizardRows] = await db.promise().execute('SELECT * FROM wizards WHERE id = ?', [id]);
    if (wizardRows.length === 0) {
      return res.status(404).json({ error: 'Wizard not found' });
    }
    const wizard = wizardRows[0];

    // Fetch associated idea and prompt details
    const [ideaRows] = await db.promise().execute('SELECT * FROM ideas WHERE id = ?', [wizard.idea_id]);
    const [promptRows] = await db.promise().execute('SELECT * FROM prompts WHERE id = ?', [wizard.prompt_id]);

    // Combine results
    const response = {
      ...wizard,
      idea: ideaRows[0] || null,
      prompt: promptRows[0] || null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching wizard:', error);
    res.status(500).json({ error: 'Failed to fetch wizard' });
  }
});



app.post('/api/weather-query', async (req, res) => {
  const { wizard_id } = req.body;

  if (!wizard_id) {
    return res.status(400).json({ error: 'Missing wizard_id' });
  }

  try {
    // Fetch wizard details
    const [wizardRows] = await db.promise().execute('SELECT * FROM wizards WHERE id = ?', [wizard_id]);
    if (wizardRows.length === 0) {
      return res.status(404).json({ error: 'Wizard not found' });
    }
    const wizard = wizardRows[0];

    // Fetch associated idea and prompt details
    const [ideaRows] = await db.promise().execute('SELECT * FROM ideas WHERE id = ?', [wizard.idea_id]);
    const [promptRows] = await db.promise().execute('SELECT * FROM prompts WHERE id = ?', [wizard.prompt_id]);

    if (ideaRows.length === 0 || promptRows.length === 0) {
      return res.status(404).json({ error: 'Idea or Prompt not found' });
    }

    const idea = ideaRows[0];
    const prompt = promptRows[0];

    // Construct GPT prompt
    const gptPrompt = `
      You are an assistant generating a weather query.
      Based on the following details:

      - Idea Name: ${idea.name}
      - Description: ${idea.description}
      - Type: ${idea.type}
      - Prompt Content: ${prompt.content}

      Generate a detailed weather query in JSON format.
      Only output valid JSON without any extra characters, comments, or explanations.
    `;

    // Call GPT API
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant generating weather queries." },
        { role: "user", content: gptPrompt },
      ],
    });

    const generatedResponse = gptResponse.choices[0].message.content.trim();

    // Clean and parse GPT response
    let apiResponse;
    try {
      const cleanedResponse = generatedResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      apiResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('GPT response is not valid JSON:', generatedResponse);
      return res.status(500).json({ error: 'GPT response is not valid JSON' });
    }

    // Insert into weather_queries table
    const [result] = await db.promise().execute(
      `INSERT INTO weather_queries (wizard_id, status, request, response)
       VALUES (?, ?, ?, ?)`,
      [
        wizard_id,
        1, // Status: completed
        JSON.stringify({ idea_name: idea.name, description: idea.description, type: idea.type, prompt_content: prompt.content }),
        JSON.stringify(apiResponse),
      ]
    );

    // Return the saved record
    res.status(201).json({
      id: result.insertId,
      wizard_id,
      status: 1,
      request: { idea_name: idea.name, description: idea.description, type: idea.type, prompt_content: prompt.content },
      response: apiResponse,
    });
  } catch (error) {
    console.error('Error generating weather query:', error);
    res.status(500).json({ error: 'Failed to generate weather query: ' + error.message });
  }
});

app.get('/api/weather-queries/:wizardId', async (req, res) => {
  const { wizardId } = req.params;

  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM weather_queries WHERE wizard_id = ? ORDER BY created_at DESC LIMIT 1',
      [wizardId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No weather query found for this wizard.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching weather query:', error);
    res.status(500).json({ error: 'Failed to fetch weather query.' });
  }
});

// const generateLastFiveDayTimestamps = () => {
//   const timestamps = [];
//   const now = new Date();
//
//   for (let i = 0; i < 5; i++) {
//     const date = new Date(now);
//     date.setDate(now.getDate() - i);
//     timestamps.push(Math.floor(date.getTime() / 1000)); // Convert to UNIX timestamp
//   }
//
//   return timestamps;
// };
//
// app.post('/api/process-weather', async (req, res) => {
//   // const { weather_query } = req.body;
//
//   let weather_query = req.body.weather_query;
//
//   console.log('Received weather_query:', weather_query);
//   if (typeof weather_query === 'string') {
//     try {
//       weather_query = JSON.parse(weather_query);
//     } catch (error) {
//       console.error('Failed to parse weather_query:', error.message);
//       return res.status(400).json({ error: 'Invalid JSON in weather_query.' });
//     }
//   }
//
//   const { latitude, longitude, data_type, location } = weather_query;
//
//   if (!latitude || !longitude || !data_type || !location) {
//     console.error('Incomplete weather_query data:', { latitude, longitude, data_type, location });
//     return res.status(400).json({ error: 'Incomplete weather_query data. Ensure latitude, longitude, data_type, and location are provided.' });
//   }
//
//   try {
//     // Generate timestamps for the last 5 days
//     const timestamps = generateLastFiveDayTimestamps();
//     if (!timestamps || timestamps.length === 0) {
//       return res.status(400).json({ error: 'Failed to generate timestamps for the last 5 days.' });
//     }
//
//     const apiKey = process.env.OPENWEATHER_API_KEY;
//     if (!apiKey) {
//       throw new Error('Missing OpenWeatherMap API key in environment variables.');
//     }
//
//     const results = [];
//
//     // Fetch weather data for each timestamp
//     for (const timestamp of timestamps) {
//       try {
//         console.log(`Fetching data for timestamp: ${timestamp}`);
//         const response = await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine', {
//           params: {
//             lat: latitude,
//             lon: longitude,
//             dt: timestamp,
//             appid: apiKey,
//             units: 'metric',
//           },
//         });
//
//         if (response.data && response.data.current && data_type in response.data.current) {
//           results.push({
//             timestamp,
//             value: response.data.current[data_type],
//           });
//         } else {
//           console.warn(`No ${data_type} data found for timestamp ${timestamp}`);
//         }
//       } catch (error) {
//         console.error(`Error fetching data for timestamp ${timestamp}:`, error.message);
//       }
//     }
//
//     if (results.length === 0) {
//       return res.status(500).json({ error: 'No weather data retrieved. Ensure timestamps are valid and within OpenWeatherMap’s supported range.' });
//     }
//
//     // Save results to a file
//     const fileName = `weather_data_${Date.now()}.json`;
//     const filePath = path.join(__dirname, 'data', fileName);
//     fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
//
//     console.log(`Weather data saved to ${filePath}`);
//
//     // Save metadata to the database
//     await db.promise().execute(
//       `INSERT INTO weather_data_files (analysis_id, file_path, type, location, year)
//        VALUES (?, ?, ?, ?, ?)`,
//       [
//         null, // Replace with the actual analysis ID if applicable
//         filePath,
//         data_type,
//         location,
//         new Date().getFullYear(),
//       ]
//     );
//
//     res.status(201).json({ message: 'Weather data processed and saved successfully.', filePath, results });
//   } catch (error) {
//     console.error('Error processing weather data:', error.message);
//     res.status(500).json({ error: 'Failed to process weather data.' });
//   }
// });

app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const weatherDataDir = path.join(__dirname, 'weather-data');

// API na načítanie údajov z lokálnych JSON súborov
app.post('/api/process-weather-simulated', async (req, res) => {
  try {
    // Prečítanie všetkých JSON súborov z adresára `weather-data`
    const files = fs.readdirSync(weatherDataDir).filter((file) => file.endsWith('.json'));

    if (!files.length) {
      return res.status(404).json({ error: 'No weather data files found in the directory.' });
    }

    let results = [];
    for (const file of files) {
      const filePath = path.join(weatherDataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      results.push(...data);
    }

    // Zoradenie podľa dátumu (pole `date` očakáva formát ISO 8601)
    results = results.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp * 1000); // Ak je `date` alebo UNIX timestamp
      const dateB = new Date(b.date || b.timestamp * 1000);
      return dateA - dateB;
    });

    console.log(`Simulated weather data processed and sorted. Total entries: ${results.length}`);

    res.status(200).json({ message: 'Simulated weather data processed and sorted successfully.', results });
  } catch (error) {
    console.error('Error processing simulated weather data:', error.message);
    res.status(500).json({ error: 'Failed to process simulated weather data.' });
  }
});

// POST /api/scenes - Generate and save scenes for a wizard
app.post('/api/scenes', async (req, res) => {
  const { wizard_id, weather_query, weather_data } = req.body;

  // Validate input
  if (!wizard_id || !weather_query || !weather_data) {
    return res.status(400).json({ error: 'wizard_id, weather_query, and weather_data are required.' });
  }

  try {
    // Generate structured scenes using GPT
    const gptPrompt = `
Based on the provided weather query and weather data, generate a structured JSON object representing the video creation flow. Ensure the response adheres to the following:

1. **Intro Scene**:
    - **type**: "intro"
    - **duration**: A brief introduction (e.g., 5 seconds).
    - **text**: Incorporate the time period or location dynamically from the weather query. Example: "Weather Recap for September and October 2024".

2. **Data Visualization Scenes**:
    - Each scene represents one month of weather data.
    - **type**: "chart"
    - **chart**:
        - **title**: The title of the chart dynamically set to the month and year (e.g., "Weather Data for September 2024").
        - **categories**: Include the following categories, each with a label, key for referencing in React, and a fixed placeholder color:
            - { "label": "Temperature", "key": "temperature", "color": "#FF5733" }
            - { "label": "Humidity", "key": "humidity", "color": "#33A1FD" }
            - { "label": "Rainfall", "key": "rainfall", "color": "#33A32F" }
            - { "label": "Air Pollution", "key": "air_pollution", "color": "#A333FD" }
    - **summary**:
        - Include:
          - Hottest day (date and value).
          - Coldest day (date and value).
          - Most rainy day (date and value).
          - A detailed analysis of notable trends or anomalies in the data for the month.

3. **Structure**:
    - Include a scene for each month in the weather data. Dynamically generate the titles and summaries based on the provided data.

4. **Output Example**:
The JSON object should follow this structure:

{
  "scenes": [
    {
      "type": "intro",
      "duration": 5,
      "text": "Weather Recap for September and October 2024"
    },
    {
      "type": "chart",
      "chart": {
        "title": "Weather Data for September 2024",
        "categories": [
          { "label": "Temperature", "key": "temperature", "color": "#FF5733" },
          { "label": "Humidity", "key": "humidity", "color": "#33A1FD" },
          { "label": "Rainfall", "key": "rainfall", "color": "#33A32F" },
          { "label": "Air Pollution", "key": "air_pollution", "color": "#A333FD" }
        ]
      },
      "summary": {
        "hottest_day": { "date": "2024-09-04", "value": 32 },
        "coldest_day": { "date": "2024-09-19", "value": 12 },
        "most_rainy_day": { "date": "2024-09-19", "value": 5.3 },
        "details": "September 2024 experienced above-average temperatures, with significant rainfall recorded mid-month."
      }
    },
    {
      "type": "chart",
      "chart": {
        "title": "Weather Data for October 2024",
        "categories": [
          { "label": "Temperature", "key": "temperature", "color": "#FF5733" },
          { "label": "Humidity", "key": "humidity", "color": "#33A1FD" },
          { "label": "Rainfall", "key": "rainfall", "color": "#33A32F" },
          { "label": "Air Pollution", "key": "air_pollution", "color": "#A333FD" }
        ]
      },
      "summary": {
        "hottest_day": { "date": "2024-10-05", "value": 28 },
        "coldest_day": { "date": "2024-10-22", "value": 8 },
        "most_rainy_day": { "date": "2024-10-15", "value": 6.1 },
        "details": "October 2024 saw cooler temperatures overall, with higher rainfall compared to September."
      }
    }
  ]
}

**Requirements**:
- Dynamically generate titles, summaries, and placeholders based on the input data.
- Ensure each scene is distinct and corresponds to a unique month of data.
- Ensure that summary is at least 3 or 4 sentences long.
- For search for anomalies in data and try to search a cause of them and include it in summary
- DONT FORGET TO ADD KEYS TO ALL CHARTS TYPES

**Input**:
- Weather Query: ${JSON.stringify(weather_query)}
- Weather Data: ${JSON.stringify(weather_data)}

**Output**:
- Return a valid JSON object that matches the structure above.
`




    // Call GPT API
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant generating video scenes." },
        { role: "user", content: gptPrompt },
      ],
    });

    let generatedScenesRaw = gptResponse.choices[0].message.content;

    // Clean up the GPT response
    try {
      generatedScenesRaw = generatedScenesRaw
        .replace(/```json/g, '') // Remove ```json
        .replace(/```/g, '') // Remove ``` (generic code blocks)
        .trim(); // Remove unnecessary whitespace or newlines

      // Parse the cleaned response into JSON
      const generatedScenes = JSON.parse(generatedScenesRaw);

      // Save scenes to the database
      for (const scene of generatedScenes.scenes) {
        try {
          await db.promise().execute(
            `INSERT INTO scenes (wizard_id, type, data) VALUES (?, ?, ?)`,
            [wizard_id, scene.type, JSON.stringify(scene)]
          );
        } catch (dbError) {
          console.error('Database error saving scene:', scene, dbError.message);
          // Continue saving other scenes even if one fails
        }
      }

      res.status(201).json({ message: 'Scenes generated and saved successfully.', scenes: generatedScenes.scenes });
    } catch (parseError) {
      console.error('Error parsing GPT response:', generatedScenesRaw, parseError.message);
      return res.status(500).json({ error: 'Failed to parse GPT response. Check the format of the response.' });
    }
  } catch (error) {
    console.error('Error generating scenes:', error.message);
    res.status(500).json({ error: 'Failed to generate scenes.' });
  }
});

// GET /api/scenes/:wizard_id - Fetch scenes for a wizard
app.get('/api/scenes/:wizard_id', async (req, res) => {
  const { wizard_id } = req.params;

  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM scenes WHERE wizard_id = ? ORDER BY created_at ASC',
      [wizard_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No scenes found for this wizard.' });
    }

    res.status(200).json({ scenes: rows });
  } catch (error) {
    console.error('Error fetching scenes:', error.message);
    res.status(500).json({ error: 'Failed to fetch scenes.' });
  }
});

// POST /api/create-video - Trigger video creation
// app.post('/api/create-video', async (req, res) => {
//   const { wizard_id } = req.body;
//
//   if (!wizard_id) {
//     return res.status(400).json({ error: 'wizard_id is required.' });
//   }
//
//   try {
//     // Fetch scenes for the wizard
//     const [scenes] = await db.promise().execute(
//       'SELECT * FROM scenes WHERE wizard_id = ? ORDER BY created_at ASC',
//       [wizard_id]
//     );
//
//     if (scenes.length === 0) {
//       return res.status(404).json({ error: 'No scenes available for this wizard.' });
//     }
//
//     // Trigger Remotion video generation (example CLI call)
//     const videoPath = `out/videos/wizard_${wizard_id}_${Date.now()}.mp4`;
//     const scenesData = scenes.map(scene => JSON.parse(scene.data));
//
//     console.log('Starting video generation with scenes:', scenesData);
//
//     // Mocking video generation logic (replace with actual CLI call to Remotion)
//     setTimeout(() => {
//       console.log('Video successfully generated:', videoPath);
//     }, 3000);
//
//     res.status(200).json({ message: 'Video generation started.', videoPath });
//   } catch (error) {
//     console.error('Error generating video:', error.message);
//     res.status(500).json({ error: 'Failed to start video generation.' });
//   }
// });

app.post('/api/render-queue', async (req, res) => {
  const { wizard_id, type } = req.body;

  if (!wizard_id || !type) {
    return res.status(400).json({ error: 'wizard_id and type are required.' });
  }

  try {
    const [result] = await db.promise().execute(
      'INSERT INTO render_queue (wizard_id, type) VALUES (?, ?)',
      [wizard_id, type]
    );

    res.status(201).json({ message: 'Render job added to queue.', id: result.insertId });
  } catch (error) {
    console.error('Error adding render job:', error.message);
    res.status(500).json({ error: 'Failed to add render job.' });
  }
});
app.post('/api/videos', async (req, res) => {
  const { wizard_id, title, status, file_path, duration, format } = req.body;

  if (!wizard_id || !title || !status) {
    return res.status(400).json({ error: 'wizard_id, title, and status are required.' });
  }

  try {
    const [result] = await db.promise().execute(
      'INSERT INTO videos (title, status, file_path, duration, format, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [title, status, file_path || null, duration || null, format || null]
    );

    res.status(201).json({ message: 'Video record added successfully.', id: result.insertId });
  } catch (error) {
    console.error('Error adding video record:', error.message);
    res.status(500).json({ error: 'Failed to add video record.' });
  }
});
app.get('/api/videos/:wizard_id', async (req, res) => {
  const { wizard_id } = req.params;

  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM videos WHERE wizard_id = ? ORDER BY created_at DESC',
      [wizard_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No videos found for this wizard.' });
    }

    res.status(200).json({ videos: rows });
  } catch (error) {
    console.error('[ERROR] Fetching videos:', error.message);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});


app.post('/api/create-video', async (req, res) => {
  const { wizard_id, render_job_id } = req.body;

  if (!wizard_id || !render_job_id) {
    return res.status(400).json({ error: 'wizard_id and render_job_id are required.' });
  }

  try {
    console.log(`[INFO] Fetching scenes for wizard_id: ${wizard_id}`);

    // Fetch scenes for the wizard
    const [scenes] = await db.promise().execute(
      'SELECT * FROM scenes WHERE wizard_id = ? ORDER BY created_at ASC',
      [wizard_id]
    );

    if (scenes.length === 0) {
      console.error(`[ERROR] No scenes found for wizard_id: ${wizard_id}`);
      return res.status(404).json({ error: 'No scenes found for this wizard.' });
    }

    console.log(`[INFO] Scenes fetched successfully for wizard_id: ${wizard_id}`);
    console.log(`[INFO] Starting video generation with scenes:`, JSON.stringify(scenes, null, 2));

    // Prepare rendering command
    const videoFileName = `video.mp4`; // Unique filename
    const renderCommand = `npm run render-video`;
    console.log(`[INFO] Running render command: ${renderCommand}`);

    // Execute rendering in the correct directory
    const remotionDir = path.resolve(__dirname, '../remotion/weather');
    console.log(`[INFO] Remotion working directory: ${remotionDir}`);

    exec(renderCommand, { cwd: remotionDir }, async (err, stdout, stderr) => {
      console.log(`[INFO] Rendering process started...`);

      if (err) {
        console.error(`[ERROR] Rendering failed: ${stderr}`);
        console.log(`[INFO] Render Command STDOUT: ${stdout}`);

        // Update render queue status to "failed"
        await db.promise().execute(
          'UPDATE render_queue SET status = ? WHERE id = ?',
          ['failed', render_job_id]
        );

        return res.status(500).json({
          error: 'Rendering failed.',
          details: stderr,
        });
      }

      console.log(`[INFO] Rendering complete.`);
      console.log(`[INFO] Render Command STDOUT: ${stdout}`);

      // Update database with video metadata
      const filePath = `out/${videoFileName}`;
      const duration = scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0); // Calculate duration dynamically
      const format = 'mp4';

      console.log(`[INFO] Inserting video metadata into database.`);
      await db.promise().execute(
        `INSERT INTO videos (wizard_id, title, status, file_path, duration, format) VALUES (?, ?, ?, ?, ?, ?)`,
        [wizard_id, `Video for Wizard ${wizard_id}`, 'completed', filePath, duration, format]
      );

      console.log(`[INFO] Video metadata saved to database.`);

      // Update render queue status to "completed"
      await db.promise().execute(
        'UPDATE render_queue SET status = ? WHERE id = ?',
        ['completed', render_job_id]
      );

      console.log(`[INFO] Render queue updated to completed for job_id: ${render_job_id}`);

      // Respond with success
      res.status(201).json({
        message: 'Video successfully rendered!',
        file_path: filePath,
      });
    });
  } catch (error) {
    console.error(`[ERROR] Error processing video rendering: ${error.message}`);

    // Update render queue status to "failed" in case of unexpected errors
    await db.promise().execute(
      'UPDATE render_queue SET status = ? WHERE id = ?',
      ['failed', render_job_id]
    );

    res.status(500).json({
      error: 'Failed to render video.',
      details: error.message,
    });
  }
});


// Serve videos from remotion/weather/out
app.get('/videos/out', express.static(path.join(__dirname, '../remotion/weather/out')));


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Test the API at http://localhost:${port}/api/test`);
});
