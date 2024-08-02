const express = require('express');
const sharp = require('sharp');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const exifParser = require('exif-parser');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const IMAGE_DIR = path.join(__dirname, 'picture'); // 本地图片目录
const IMAGE_COMPRESSION_QUALITY = parseInt(process.env.IMAGE_COMPRESSION_QUALITY, 10);

const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

async function checkAndCreateThumbnail(filePath) {
  const thumbnailPath = path.join(__dirname, 'picture', 'preview', path.basename(filePath));

  if (fs.existsSync(thumbnailPath)) {
    return thumbnailPath;
  } else {
    const imageBuffer = fs.readFileSync(filePath);
    const sharpInstance = sharp(imageBuffer).resize(200).withMetadata();

    if (IMAGE_COMPRESSION_QUALITY >= 0 && IMAGE_COMPRESSION_QUALITY <= 100) {
      sharpInstance.jpeg({ quality: IMAGE_COMPRESSION_QUALITY });
    }

    const thumbnailBuffer = await sharpInstance.toBuffer();
    fs.writeFileSync(thumbnailPath, thumbnailBuffer);

    return thumbnailPath;
  }
}

async function getExifData(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const parser = exifParser.create(imageBuffer);
  const exifData = parser.parse().tags;
  return {
    FNumber: exifData.FNumber,
    ExposureTime: exifData.ExposureTime,
    ISO: exifData.ISO,
  };
}

app.use(express.static('public'));
app.use('/picture', express.static(IMAGE_DIR));
app.use('/music', express.static(path.join(__dirname, 'music')));

app.get('/images', async (req, res) => {
  try {
    const files = fs.readdirSync(IMAGE_DIR);
    const imageUrls = await Promise.all(files.map(async (file) => {
      const filePath = path.join(IMAGE_DIR, file);
      const fileExtension = path.extname(file).toLowerCase();
      if (!validImageExtensions.includes(fileExtension) || fs.statSync(filePath).isDirectory()) {
        return null;
      }
      const thumbnailPath = await checkAndCreateThumbnail(filePath);
      return {
        original: `/picture/${file}`,
        thumbnail: `/picture/preview/${path.basename(thumbnailPath)}`,
      };
    }));
    res.json(imageUrls.filter(url => url !== null));
  } catch (error) {
    console.error('Error loading images:', error);
    res.status(500).send('Error loading images');
  }
});

app.get('/exif/:filename', async (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(IMAGE_DIR, filename);
  try {
    const exifData = await getExifData(filePath);
    res.json(exifData);
  } catch (error) {
    console.error('Error getting EXIF data:', error);
    res.status(500).send('Error getting EXIF data');
  }
});

app.get('/config', (req, res) => {
  res.json({ IMAGE_BASE_URL: '/picture' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});

