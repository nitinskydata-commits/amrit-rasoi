const http = require('http');

const testLogin = (email, password) => {
    const data = JSON.stringify({ email, password });
    
    const options = {
        hostname: 'localhost',
        port: 5002,
        path: '/api/v1/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Body: ${body}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
};

async function run() {
    console.log('Testing Admin Login with Admin@123...');
    await testLogin('admin@sbmi.com', 'Admin@123').catch(() => {});
    
    console.log('\nTesting Admin Login with admin123...');
    await testLogin('admin@sbmi.com', 'admin123').catch(() => {});
}

run();
