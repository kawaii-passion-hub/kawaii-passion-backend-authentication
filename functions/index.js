const fetch = require('node-fetch');
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

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

    if (!body || !body.data) {
        return res.status(404).end('Unable to fetch the app data :/');
    }

    var db = admin.database();
    var products = Object.fromEntries(body.data.map((p) => [p.productNumber.replace(/\./g,"-"), p]));
    await db.ref().update({
        products: products
    }, (error) => {
        if (error) {
          body = error;
        }
        else {
            body = "Sucessfully added data";
        }
    });

    res.send(body);
});

exports.dbTest = functions.https.onRequest(async (req, res) => {
    let body = '';

    var db = admin.database();
    var ref = db.ref("products");
    await ref.child(`my-awesome-product-${Date.now()}`).set({
        id: "596897",
        description: "Lora Lipsum..."
    }, (error) => {
        if (!error) {
          body = "Sucessfully added data";
        }
    });

    if (!body) {
        return res.status(404).end('Unable to set the app data :/');
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