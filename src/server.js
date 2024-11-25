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
import sharp from 'sharp';


const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable private network requests and handle preflight requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });

const PORT = process.env.PORT || 3002;
const apiKey = process.env.STABILITY_API_KEY;
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
        try {
            const imageRef = ref(storage, `album/${refCode}`);
            return getDownloadURL(imageRef);
        } catch (error) {
            console.error(`Error fetching image URL for reference code ${refCode}:`, error);
            return null;
        }
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

async function resizeImageTo1024x1024(imagePath) {
    const tempImagePath = path.join(__dirname, 'temp_image.png');
    await sharp(imagePath)
        .resize(1024, 1024)
        .toFile(tempImagePath);
    console.log(`1024x1024`);

    
    fs.renameSync(tempImagePath, imagePath);
}

async function saveBase64Image(base64Data, filepath) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);
}

async function testInpaint({ init_image_url, prompt, mask_image_url }) {
    const init_image_path = path.join(__dirname, 'init_image.png');
    const mask_image_path = path.join(__dirname, 'mask_image.png');
    const output_image_path = path.join(__dirname, 'output_image.png');

    try {
        await downloadImage(init_image_url, init_image_path);
        await downloadImage(mask_image_url, mask_image_path);

        await resizeImageTo1024x1024(init_image_path);
        await resizeImageTo1024x1024(mask_image_path);

        const formData = new FormData();
        formData.append('init_image', fs.createReadStream(init_image_path));
        formData.append('mask_image', fs.createReadStream(mask_image_path));
        formData.append('mask_source', 'MASK_IMAGE_BLACK');
        formData.append('text_prompts[0][text]', prompt);
        formData.append('cfg_scale', 7);
        formData.append('samples', 4);
        formData.append('steps', 30);

        const engineId = 'stable-diffusion-xl-1024-v1-0';
        const endpoint = `${apiHost}/v1/generation/${engineId}/image-to-image/masking`;

        const response = await axios.post(endpoint, formData, {
            headers: {
                ...formData.getHeaders(),
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        });

        console.log('Response Status:', response.status);
        console.log('Response Body:', response.data);

        if (response.status !== 200) {
            throw new Error(`Non-200 response: ${response.data}`);
        }

        const imageData = response.data.artifacts[0].base64;
        await saveBase64Image(imageData, output_image_path);

        console.log('Generated Images saved at:', output_image_path);

        
        return imageData; 


    } catch (error) {
        console.error('Error making API request', error.message);

        if (error.response) {
            console.error('Error response status:', error.response.status);
            try {
                console.error('Error response body:', error.response.data);
            } catch (e) {
                console.error('Unable to parse error response body', e);
            }
        } else {
            console.error('No response received:', error);
        }
    } finally {
       
        if (fs.existsSync(init_image_path)) fs.unlinkSync(init_image_path);
        if (fs.existsSync(mask_image_path)) fs.unlinkSync(mask_image_path);
    }
}

app.post('/generate-image', async (req, res) => {
    console.log('Received request:', req.body);
    const { prompt } = req.body;
    const { text, refCodes } = extractTextAndRefs(prompt);

    console.log('Extracted text:', text);
    console.log('Extracted refCodes:', refCodes);

    try {
        if (refCodes.length > 0) {
            // Handle image-to-image generation
            const imageUrls = await getFirebaseImageURLs(refCodes);
            console.log('Fetched imageURLs from Firebase:', imageUrls);

                        if (imageUrls.includes(null)) {
                res.status(400).json({ error: 'One or more reference IDs do not exist.' });
                return;
            }

            const imagePath = path.join(tempDir, 'downloaded_image.png');
            await downloadImage(imageUrls[0], imagePath);

            const formData = new FormData();
            formData.append('init_image', fs.createReadStream(imagePath));
            formData.append('init_image_mode', 'IMAGE_STRENGTH');
            formData.append('image_strength', 0.28); //Original 0.35
            formData.append('text_prompts[0][text]', text);
            formData.append('cfg_scale', 7);
            formData.append('samples', 4);
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
            const images = responseJSON.artifacts.map((image) => ({
                url: `data:image/png;base64,${image.base64}`,
            }));

            res.json({ images });
        } else {
            // Handle text-to-image generation
            const response = await fetch(`${apiHost}/v1/generation/stable-diffusion-v1-6/text-to-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    text_prompts: [{ text }],
                    cfg_scale: 7,
                    height: 512,
                    width: 512,
                    steps: 30,
                    samples: 4,
                }),
            });

            if (!response.ok) {
                throw new Error(`Non-200 response: ${await response.text()}`);
            }

            const responseJSON = await response.json();
            const images = responseJSON.artifacts.map((image) => ({
                url: `data:image/png;base64,${image.base64}`,
            }));

            res.json({ images });
        }
    } catch (error) {
        console.error('Error making API request', error);
        res.status(500).send('Error generating image');
    }
});

app.post('/api/generate-image', async (req, res) => {
    const { init_image_url, prompt, mask_image_url } = req.body;

    console.log('Received inpaint request:', req.body);

    try {
        //await testInpaint({ init_image_url, prompt, mask_image_url });
        //res.status(200).send('Image generated and saved successfully.');
        const imageData = await testInpaint({ init_image_url, prompt, mask_image_url });
        res.status(200).json({ image: `data:image/png;base64,${imageData}` });


    } catch (error) {
        console.error('Error generating inpaint image:', error);
        res.status(500).send('Error generating inpaint image');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
