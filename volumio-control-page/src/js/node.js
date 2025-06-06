// server.js - jednoduchý Node.js server
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const ytdl = require('ytdl-core');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/get-audio-url', (req, res) => {
  const { videoUrl } = req.body;
  
  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  // Spustit yt-dlp k získání URL audio streamu
  exec(`yt-dlp --get-url -f bestaudio ${videoUrl}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    
    // yt-dlp vrátí URL audio streamu
    const audioUrl = stdout.trim();
    res.json({ audioUrl });
  });
});

// Na serveru, kde máte Node.js
// Získat informace o dostupných formátech pro konkrétní video
app.get('/video-formats', (req, res) => {
  const { videoUrl } = req.query;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  ytdl.getInfo(videoUrl)
    .then(info => {
      const formats = info.formats
        .filter(format => format.hasAudio)
        .map(format => ({
          mimeType: format.mimeType,
          audioQuality: format.audioQuality
        }));

      res.json({ availableFormats: formats });
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      res.status(500).json({ error: error.message });
    });
});

// Test - Získat informace o dostupných formátech pro konkrétní video
ytdl.getInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(info => {
    console.log('Dostupné formáty:');
    info.formats.forEach(format => {
        if (format.hasAudio) {
            console.log(`- Formát: ${format.mimeType}, kvalita: ${format.audioQuality}`);
        }
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});