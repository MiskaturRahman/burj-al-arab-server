const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()
console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.grz5f.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 4000;

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-393b6-firebase-adminsdk-q1oe1-71ddc9378c.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");


    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        console.log(newBooking);
    })


    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;


        if (bearer && bearer.startsWith('Bearer  ')) {
            const idToken = bearer.split('  ')[1];
            console.log({ idToken });

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;

                    console.log(tokenEmail, queryEmail);

                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }

                    // ...
                }).catch(function (error) {
                    res.status(401).send('unauthorized access');
                });
        }

        else {
            res.status(401).send('unauthorized access');
        }

    })
})



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)