const axios = require('axios');
const serverUrl = 'http://localhost:3002/generate-image';

describe('Image Generator API', () => {
  it('should generate an image from text prompt', async () => {
    const prompt = 'A beautiful sunset over the mountains';

    try {
      const response = await axios.post(serverUrl, { prompt });
      const { images } = response.data;

      expect(response.status).toBe(200);
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBeGreaterThan(0);
      images.forEach(image => {
        expect(image).toHaveProperty('url');
        expect(image.url).toMatch(/^data:image\/png;base64,/);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  });
});
