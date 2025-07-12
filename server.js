import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// --- Load prompt files ---
const alldataPromptPath = path.join(__dirname, 'alldata_prompt.txt');
const locationPromptPath = path.join(__dirname, 'location_prompt.txt');
let alldataPromptText, locationPromptText;

try {
  alldataPromptText = await fs.readFile(alldataPromptPath, 'utf8').then(text => text.trim());
  locationPromptText = await fs.readFile(locationPromptPath, 'utf8').then(text => text.trim());
} catch (error) {
  console.error('Error loading prompt files. Make sure both alldata_prompt.txt and location_prompt.txt exist.', error);
  process.exit(1);
}

// --- Define the structured output schema for the 'alldata' endpoint ---
const dataExtractionSchema = {
    name: 'extract_data',
    description: 'Extracts structured data from an audio transcript of an emergency call.',
    parameters: {
      type: 'OBJECT',
      properties: {
        event_info_text: { type: 'STRING' }, event_type: { type: 'STRING' },
        event_sub_type: { type: 'STRING' }, state_of_victim: { type: 'STRING' },
        victim_gender: { type: 'STRING' }, specified_matter: { type: 'STRING' },
        date_reference: { type: 'STRING' },
        injury_type: { type: 'STRING' }, victim_age: { type: 'INTEGER' },
        object_involved: { type: 'STRING' }, used_weapons: { type: 'STRING' },
        need_ambulance: { type: 'BOOLEAN' }, children_involved: { type: 'BOOLEAN' },
        generated_event_sub_type_detail: { type: 'STRING' },
      },
      required: ['event_info_text', 'event_type', 'event_sub_type']
    }
  };

const defaultData = Object.keys(dataExtractionSchema.parameters.properties).reduce((acc, key) => {
    acc[key] = null;
    return acc;
}, {});

// --- Initialize a single Gemini client and model instance ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { temperature: 0.15 },
});


// --- UPDATED Endpoint for location-only extraction ---
app.post('/extract-location-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Audio file is required' });

        const audioPath = path.join(__dirname, req.file.path);
        const audioBuffer = await fs.readFile(audioPath);
        const audioBase64 = audioBuffer.toString('base64');
        await fs.unlink(audioPath);

        const parts = [
            { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } },
            { text: locationPromptText }
        ];

        // Get the plain text string from the model
        const result = await model.generateContent(parts);
        const locationString = result.response.text();

        // Create the JSON object on the server
        const responseJson = {
            incident_location: locationString
        };

        // Send the JSON response
        res.json(responseJson);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process audio for location.', details: error.message });
    }
});


// --- Endpoint for all data extraction (remains the same) ---
app.post('/extract-alldata-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file is required' });

    const audioPath = path.join(__dirname, req.file.path);
    const audioBuffer = await fs.readFile(audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    await fs.unlink(audioPath);

    const parts = [
      { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } },
      { text: alldataPromptText }
    ];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      tools: [{ functionDeclarations: [dataExtractionSchema] }],
      toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    });
    
    const response = result.response;
    const call = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (call) {
      const extractedData = call.args;
      const fullData = { ...defaultData, ...extractedData };
      res.json(fullData);
    } else {
        console.error("Model did not return a function call. Full response:", JSON.stringify(response, null, 2));
        let errorMessage = 'Model did not return the expected structured data.';
        if (response.candidates?.[0]?.finishReason) {
            errorMessage = `Model response finished with reason: '${response.candidates[0].finishReason}'.`;
        }
        res.status(500).json({ 
            error: errorMessage,
            responseText: response.candidates?.[0]?.content?.parts?.[0]?.text || null 
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process audio for all data.', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
