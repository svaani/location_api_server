const functions = require('firebase-functions');
const express = require('express');

const app = express();
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");


// Your web app's Firebase configuration
var firebaseConfig = {
    // apiKey: "AIzaSyDsIqphipO5CrmnTRpBMdNz35fuDb4yzfA",
    // authDomain: "gaadicalls.firebaseapp.com",
    databaseURL: "https://gaadicalls.firebaseio.com",
    // projectId: "gaadicalls",
    // storageBucket: "gaadicalls.appspot.com",
    // messagingSenderId: "142609654495",
    // appId: "1:142609654495:web:55c9d4dd125349355dff6a",
    credential: admin.credential.cert(serviceAccount)
};
// Initialize Firebase
admin.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/track', function (req, res) {
    res.send({
        lat: 33,
        lng: 33
    });
});

app.get('/add_user/:id/:lat/:lng', async function (req, res) {
    await db.collection("Householders").add(
        {
            "DeviceId": req.params.id,
            "lat": req.params.lat,
            "lng": req.params.lng
        });
    res.send('add user success');
});

app.get('/add_vendor/:id', async function (req, res) {
    await db.collection("WalkingVendors").add(
        {
            "DeviceId": req.params.id
        });
    res.send('vendor added')
});


//Vendor app need to update location again and again
app.get('/update_location/:id/:lat/:lng', async function (req, res) {

    let listOfAll = await db.collection("Householders").getDocuments();
    await listOfAll.documents.forEach((entry) => {
        if (distance(req.params.lat, req.params.lng, entry.data["lat"], entry.data["lng"], "K") < 2) {
            let payload = {
                notification: {
                    title: 'Vendor is nearby',
                    body: ''
                    }
            };
            admin.messaging().sendToDevice("Random"+entry.data["DeviceId"], payload);
        }

    });
    res.send('update location of vendor success');
});

//For the householder to add location once
app.get('/associate_vendor/:id/:vid', function (req, res) {
    res.send('Hello World')
});

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles (default)                         :::
//:::                  'K' is kilometers                                      :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at https://www.geodatasource.com                         :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: https://www.geodatasource.com                       :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2018            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") { dist = dist * 1.609344 }
        if (unit == "N") { dist = dist * 0.8684 }
        return dist;
    }
}

exports.app = functions.https.onRequest(app);

// ((request, response) => {
//  response.send("Hello from Firebase!");
//});
