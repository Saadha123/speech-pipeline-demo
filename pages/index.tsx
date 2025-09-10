import React, { useState } from 'react';
// import VAD from '@ricky0123/vad-react';

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Real STT and TTS endpoints
  async function transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setTranscript(JSON.stringify(data.error));
        console.error('Transcription error:', data.error);
      } else {
        setTranscript(data.transcript || '');
      }
    } catch (err) {
      setTranscript('Transcription request failed');
      console.error('Transcription request failed:', err);
    }
  }

  async function synthesizeSpeech(text: string) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('TTS error:', error);
        alert('Failed to convert text to speech. Please try again.');
        return;
      }

      const audioBuffer = await res.arrayBuffer();
      // Convert PCM F32LE to WAV for browser playback
      const pcmData = new Float32Array(audioBuffer);
      const wavBuffer = new ArrayBuffer(44 + pcmData.length * 4);
      const view = new DataView(wavBuffer);
      
      // Write WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length * 4, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 3, true); // Format: IEEE float
      view.setUint16(22, 1, true); // Channels: 1
      view.setUint32(24, 24000, true); // Sample rate
      view.setUint32(28, 24000 * 4, true); // Byte rate
      view.setUint16(32, 4, true); // Block align
      view.setUint16(34, 32, true); // Bits per sample
      writeString(view, 36, 'data');
      view.setUint32(40, pcmData.length * 4, true);
      
      // Write PCM data
      const pcmView = new Float32Array(wavBuffer, 44);
      pcmView.set(pcmData);
      
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new window.Audio(url);
      
      // Clean up the URL after playback
      audio.onended = () => URL.revokeObjectURL(url);
      
      try {
        await audio.play();
      } catch (err) {
        console.error('Audio playback error:', err);
        alert('Failed to play audio. Please check your audio settings.');
      }
    } catch (err) {
      console.error('TTS request failed:', err);
      alert('Failed to process text-to-speech request. Please try again.');
    }
  }

  // Simple VAD using Web Audio API (volume threshold)
  React.useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let mediaStream: MediaStream | null = null;
    let recording = false;
    let chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;

    async function startMic() {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioContext = new window.AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 2048;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(audioBlob));
        await transcribeAudio(audioBlob);
        chunks = [];
      };
      detectSpeech();
    }

    function detectSpeech() {
      if (!analyser || !dataArray) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(data);
      // Calculate volume
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += Math.abs(data[i] - 128);
      }
      const volume = sum / dataArray.length;
      if (volume > 10 && !recording) {
        setIsRecording(true);
        recording = true;
        mediaRecorder?.start();
      } else if (volume < 5 && recording) {
        setIsRecording(false);
        recording = false;
        mediaRecorder?.stop();
      }
      requestAnimationFrame(detectSpeech);
    }

    startMic();
    return () => {
      audioContext?.close();
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8f9fa',
      color: '#1a1a1a'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1.5rem',
          color: '#2563eb',
          textAlign: 'center'
        }}>Speech Pipeline Demo</h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#4b5563',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>Speak into your microphone. VAD will detect speech and transcribe it.</p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            background: isRecording ? '#ef4444' : '#22c55e',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              opacity: isRecording ? '1' : '0.7'
            }} />
            {isRecording ? 'Recording...' : 'Idle'}
          </div>
        </div>

        <div style={{
          background: '#f3f4f6',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          minHeight: '100px'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.5rem'
          }}>Transcript</div>
          <div style={{
            fontSize: '1.1rem',
            color: '#1f2937',
            lineHeight: '1.6'
          }}>{transcript || 'No transcript yet...'}</div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={() => synthesizeSpeech(transcript)}
            disabled={!transcript}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: transcript ? 'pointer' : 'not-allowed',
              opacity: transcript ? '1' : '0.7',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play Transcript
          </button>

          {audioUrl && (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <audio 
                controls 
                src={audioUrl} 
                style={{
                  width: '100%'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
