import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import sharp from 'sharp';
import open from 'open';  
import 'dotenv/config';

const apiKey = process.env.STABILITY_API_KEY;
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log(`图像尺寸已调整为 1024x1024`);

   
    fs.renameSync(tempImagePath, imagePath);
}

async function saveBase64Image(base64Data, filepath) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);
}

export async function testInpaint({ init_image_url, prompt, mask_image_url }) {
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
        formData.append('samples', 1);
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

        
        await open(output_image_path);
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
