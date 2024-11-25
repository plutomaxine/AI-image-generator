import http from 'http';

const checkServer = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Failed to load ${url}, status code: ${res.statusCode}`));
            }
        }).on('error', (e) => {
            reject(e);
        });
    });
};

const testServers = async () => {
    try {
        const frontendUrl = 'http://localhost:3000';
        const backendUrl = 'http://localhost:3002';

        console.log(`Checking ${frontendUrl}`);
        await checkServer(frontendUrl);
        console.log('Frontend server is running.');

        console.log(`Checking ${backendUrl}`);
        await checkServer(backendUrl);
        console.log('Backend server is running.');
        
        console.log('Both servers are running.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

testServers();
