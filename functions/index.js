const fetch = require('node-fetch');
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

//Admin acces to database
const { initializeApp } = require('firebase-admin/app');

exports.mirrorCron = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    console.log('This will be run every 5 minutes!');

    return null;
});

exports.mirrorTest = functions.runWith({ secrets: ["API_ID", "API_SECRET"] }).https.onRequest(async (req, res) => {
    let body = '';

    await shopLogin().then(data => body = data).catch(err => res.status(400).end(JSON.stringify(err)));

    if (!body || !body.token_type || !body.access_token) {
        return res.status(404).end('Unable to fetch the app data :/');
    }

    const auth = `${body.token_type} ${body.access_token}`;
    
    await getProducts(auth).then(data => body = data).catch(err => res.status(400).end(JSON.stringify(err)));

    if (!body) {
        return res.status(404).end('Unable to fetch the app data :/');
    }

    res.send(body);
});

async function getProducts(auth) {
    return await fetch(`${process.env.SHOP_URL}/api/product?`,
    {
        method: 'GET',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then (response => {
        if (response.status != 200){
            throw `fetch Error: ${response.status} ${response.statusText}`
        }
        return response.json();
    });
}

async function shopLogin() {
    return await fetch(`${process.env.SHOP_URL}/api/oauth/token`,
    {
        method: 'POST',
        headers: {
            'Authorization': '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: process.env.API_ID,
            client_secret: process.env.API_SECRET
        })
    }).then (response => {
        if (response.status != 200){
            throw `fetch Error: ${response.status} ${response.statusText}`
        }
        return response.json();
    });
}