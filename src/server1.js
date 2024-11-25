import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { storage } from './config/firebase.js';
import { ref, getDownloadURL } from 'firebase/storage';
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3002;
const apiKey = 'sk-uFlM8HIZ6dCtdSmGUI8sy3sMgUYHQYGyky0Zh2JUUTfOh8Cz';
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai';

if (!apiKey) throw new Error('Missing Stability API key.');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

function extractTextAndRefs(input) {
    const refRegex = /REF_\w{5}/g;
    const refMatches = input.match(refRegex) || [];
    let text = input;
    refMatches.forEach((ref, index) => {
        text = text.replace(ref, `image${index + 1}`);
    });
    return { text, refCodes: refMatches };
}

async function getFirebaseImageURLs(refCodes) {
    const urls = await Promise.all(refCodes.map(async refCode => {
        const imageRef = ref(storage, `album/${refCode}`);
        return getDownloadURL(imageRef);
    }));
    return urls;
}

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('finish', () => resolve(filepath))
            .on('error', e => reject(e));
    });
}

app.post('/generate-image', async (req, res) => {
    console.log('Received request:', req.body);
    const { prompt } = req.body;
    const { text, refCodes } = extractTextAndRefs(prompt);

    console.log('Extracted text:', text);
    console.log('Extracted refCodes:', refCodes);
    try {
        let imageUrls = [];

        if (refCodes.length > 0) {
            imageUrls = await getFirebaseImageURLs(refCodes);
            console.log('Fetched imageURLs from Firebase:', imageUrls);
        }

        // 指定下载路径和文件名
        const imagePath = path.join(tempDir, 'downloaded_image.png');
        await downloadImage(imageUrls[0], imagePath);

        const formData = new FormData();
        formData.append('init_image', fs.createReadStream(imagePath)); // 使用下载的图片
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', 0.35);
        formData.append('text_prompts[0][text]', text);
        formData.append('cfg_scale', 7);
        formData.append('samples', 1);
        formData.append('steps', 30);

        const response = await fetch(`${apiHost}/v1/generation/stable-diffusion-v1-6/image-to-image`, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Non-200 response: ${await response.text()}`);
        }

        const responseJSON = await response.json();

        // responseJSON.artifacts.forEach((image, index) => {
        //     fs.writeFileSync(path.join(__dirname, 'output', `v1_img2img_${index}.png`), Buffer.from(image.base64, 'base64'));
        // });
        const images = responseJSON.artifacts.map((image) => ({
            url: `data:image/png;base64,${image.base64}`,
        }));

        res.json({ images });
    } catch (error) {
        console.error('Error making API request', error);
        res.status(500).send('Error generating image');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
