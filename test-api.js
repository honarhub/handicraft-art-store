const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/artists',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const artists = JSON.parse(data);
    const pendingArtist = artists.find(a => a.hasPendingEdits);
    if (!pendingArtist) {
      console.log('No artist with pending edits found');
      return;
    }
    console.log('Found artist with pending edits:', pendingArtist.id);
    
    // Now trigger PATCH
    const patchData = JSON.stringify({ action: 'approveEdits', adminFeedback: '' });
    const patchOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/artists/' + pendingArtist.id,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': patchData.length
      }
    };
    
    const patchReq = http.request(patchOptions, patchRes => {
      let patchBody = '';
      patchRes.on('data', chunk => patchBody += chunk);
      patchRes.on('end', () => {
        console.log('Status:', patchRes.statusCode);
        console.log('Response:', patchBody);
      });
    });
    
    patchReq.write(patchData);
    patchReq.end();
  });
});
req.end();
