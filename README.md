# Emergency Call Data Extraction API

A Node.js API server that uses Google's Gemini AI to extract structured data and location information from emergency call audio recordings. This system is designed to process emergency calls, transcribe them, translate to English, and extract critical information like incident details, victim information, and precise location data.

## 🚀 Features

- **Audio Processing**: Upload and process audio files of emergency calls
- **AI-Powered Transcription**: Uses Google Gemini 2.0 Flash model for accurate transcription
- **Multi-language Support**: Automatically translates calls to English
- **Structured Data Extraction**: Extracts detailed incident information in a structured format
- **Location Intelligence**: Extracts precise location data suitable for Google Maps searches
- **Emergency Response Categories**: Categorizes incidents into predefined emergency types

## 📋 Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Data Schema](#data-schema)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## 🛠 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/hadityakumar/reverse_geocoding_gemini.git
   cd reverse_geocoding_gemini/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** 

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` (or the port specified in your environment variables).

## 🔧 Environment Setup

Create a `.env` file in the server directory with the following variables:

```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3000
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 🚀 Usage

### Starting the Server

```bash
# Development
npm start

# Or with custom port
PORT=8080 npm start
```

### Making API Requests

Use tools like Postman, curl, or any HTTP client to interact with the API:

```bash
# Example using curl for location extraction
curl -X POST \
  http://localhost:3000/extract-location-audio \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@path/to/your/audio/file.mp3"
```

## 📡 API Endpoints

### 1. Extract Location Data

**Endpoint**: `POST /extract-location-audio`

**Description**: Extracts location information from emergency call audio and formats it for Google Maps search.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (field name: `audio`)

**Supported Audio Formats**:
- MP3
- WAV
- M4A
- OGG
- FLAC

**Response**:
```json
{
  "incident_location": "Sunrise Hotel, Lal Thappad, Dehradun"
}
```

**Example**:
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

fetch('http://localhost:3000/extract-location-audio', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### 2. Extract Complete Emergency Data

**Endpoint**: `POST /extract-alldata-audio`

**Description**: Extracts comprehensive structured data from emergency call audio including incident details, victim information, and location.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (field name: `audio`)

**Response**:
```json
{
  "event_info_text": "Full English transcription of the emergency call",
  "event_type": "MEDICAL EMERGENCIES",
  "event_sub_type": "Heart Attack",
  "state_of_victim": "Unconscious",
  "victim_gender": "Male",
  "specified_matter": "Chest pain and difficulty breathing",
  "date_reference": "Today morning",
  "injury_type": "Cardiac",
  "victim_age": 65,
  "object_involved": null,
  "used_weapons": null,
  "need_ambulance": true,
  "children_involved": false,
  "generated_event_sub_type_detail": "Suspected myocardial infarction"
}
```

## 📊 Data Schema

### Emergency Event Types

The system categorizes incidents into the following predefined types:

- `VIOLENT CRIME`
- `THEFT & BURGLARY`
- `TRAFFIC INCIDENTS`
- `SOCIAL ISSUES`
- `PUBLIC NUISANCE`
- `FIRE & HAZARDS`
- `MISSING PERSONS`
- `NATURAL INCIDENTS`
- `PUBLIC DISTURBANCE`
- `RESCUE OPERATIONS`
- `MEDICAL EMERGENCIES`

### Complete Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `event_info_text` | String | Full English transcription of the call |
| `event_type` | String | Primary category (from predefined list) |
| `event_sub_type` | String | Specific type of incident |
| `state_of_victim` | String | Current condition of the victim |
| `victim_gender` | String | Gender of the victim |
| `specified_matter` | String | Detailed description of the issue |
| `date_reference` | String | Time reference mentioned in call |
| `injury_type` | String | Type of injury if applicable |
| `victim_age` | Integer | Age of the victim |
| `object_involved` | String | Any objects involved in the incident |
| `used_weapons` | String | Weapons used (if any) |
| `need_ambulance` | Boolean | Whether ambulance is required |
| `children_involved` | Boolean | Whether children are involved |
| `generated_event_sub_type_detail` | String | AI-generated detailed sub-categorization |

## 🔧 AI Processing Pipeline

### 1. Audio Processing
- Audio files are uploaded via multipart form data
- Files are temporarily stored in the `uploads/` directory
- Audio is converted to base64 for AI processing
- Temporary files are automatically cleaned up

### 2. AI Analysis
- **Model**: Google Gemini 2.0 Flash
- **Temperature**: 0.15 (for consistent, factual responses)
- **Capabilities**: 
  - Multi-language transcription
  - Automatic translation to English
  - Structured data extraction
  - Location intelligence

### 3. Response Processing
- Location data is formatted for Google Maps compatibility
- Structured data follows a predefined schema
- Missing information is marked as `null`
- Error handling for invalid or unclear audio

## ⚠️ Error Handling

### Common Error Responses

```json
{
  "error": "Audio file is required"
}
```

```json
{
  "error": "Failed to process audio for location.",
  "details": "Specific error message"
}
```

```json
{
  "error": "Model did not return the expected structured data.",
  "responseText": "Raw model response if available"
}
```

### Error Status Codes

- `400`: Bad Request (missing audio file)
- `500`: Internal Server Error (processing failure)

## 🏗️ Project Structure

```
server/
├── server.js              # Main application file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in repo)
├── .gitignore            # Git ignore rules
├── alldata_prompt.txt    # AI prompt for complete data extraction
├── location_prompt.txt   # AI prompt for location extraction
├── uploads/              # Temporary audio file storage
└── README.md            # This file
```

## 🔐 Security Considerations

- API keys are stored in environment variables
- Uploaded audio files are automatically deleted after processing
- No persistent storage of sensitive audio data
- CORS can be configured for production deployment

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment

1. **Environment Variables**: Ensure all required environment variables are set
2. **Process Manager**: Use PM2 or similar for process management
3. **Reverse Proxy**: Configure nginx or similar for production
4. **HTTPS**: Enable SSL/TLS encryption
5. **File Limits**: Configure appropriate file upload limits

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---

**Built with ❤️ using Node.js, Express, and Google Gemini AI**