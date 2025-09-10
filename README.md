# Speech Pipeline Demo

A modern web application that demonstrates a complete speech processing pipeline using Voice Activity Detection (VAD), Speech-to-Text (STT), and Text-to-Speech (TTS) capabilities.

## Features

- **Real-time Voice Activity Detection (VAD)**: Automatically detects when someone is speaking using Web Audio API
- **Speech-to-Text (STT)**: Transcribes speech using Groq Whisper API
- **Text-to-Speech (TTS)**: Converts text back to natural-sounding speech using Cartesia API
- **Modern UI**: Clean, responsive interface with visual feedback
- **Error Handling**: Comprehensive error handling and user feedback

## Technologies Used

- **Frontend**:
  - Next.js
  - React
  - TypeScript
  - Web Audio API for VAD

- **Backend**:
  - Next.js API Routes
  - Groq Whisper API for STT
  - Cartesia API for TTS

- **Libraries**:
  - formidable: For handling multipart/form-data
  - axios: For API requests
  - form-data: For creating form data

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Saadha123/speech-pipeline-demo.git
   cd speech-pipeline-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory with:
   ```env
   GROQ_API_KEY=your_groq_api_key
   CARTESIA_API_KEY=your_cartesia_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Voice Activity Detection**:
   - Uses Web Audio API to analyze audio input
   - Automatically starts recording when speech is detected
   - Stops recording when silence is detected

2. **Speech-to-Text**:
   - Recorded audio is sent to Groq Whisper API
   - Returns accurate transcription of spoken words
   - Displays transcription in the UI

3. **Text-to-Speech**:
   - Transcribed text can be converted back to speech
   - Uses Cartesia API for natural-sounding voice synthesis
   - Plays audio through the browser

## API Routes

- **/api/transcribe**: Handles speech-to-text conversion
  - Method: POST
  - Input: Audio file (WAV format)
  - Output: Transcribed text

- **/api/tts**: Handles text-to-speech conversion
  - Method: POST
  - Input: Text to convert
  - Output: Audio data

## Requirements

- Node.js 14.x or later
- Modern web browser with microphone support
- Groq API key for speech-to-text
- Cartesia API key for text-to-speech

## Contributing

Feel free to open issues or submit pull requests for improvements.

## License

MIT License - feel free to use this project as you wish.

## Acknowledgments

- Groq for their excellent Whisper API
- Cartesia for their Text-to-Speech API
