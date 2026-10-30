const https = require('https');

const data = JSON.stringify({
  query: `
    query getBuild($id: ID!) {
      appBuild(id: $id) {
        id
        artifacts {
          buildUrl
        }
      }
    }
  `,
  variables: { id: "eb11d05a-5faf-4c0d-976b-40bbfa37af22" }
});

const options = {
  hostname: 'api.expo.dev',
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
