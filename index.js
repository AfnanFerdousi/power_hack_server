const express = require('express')
const cors = require('cors');
const uuid = require('uuid');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()

//port of the server
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1qjysd6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//  JSON WEB TOKEN
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    await client.connect();
    try {
        const userCollection = client.db('power_hack').collection('userCollection');
        const billCollection = client.db('power_hack').collection('billCollection');

        // REGISTER USER
        app.post('/api/registration', async (req, res) => {
            const emailExists = await userCollection.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already exists" });
            }
            else {
                const email = req.body.email;
                const user = req.body;
                const result = await userCollection.insertOne(user);
                const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
                console.log(user)
                res.send({ result, token });
            }
        })

        // LOGIN USER
        app.post('/api/login', async (req, res) => {
            const user = await userCollection.findOne({ email: req.body.email });
            const pass = await userCollection.findOne({ password: req.body.password });
            if (!user) {
                return res.status(400).json({ message: "Email not found" });
            } else if (!pass) {
                return res.status(400).json({ message: "Incorrect Password" });
            } else {
                const token = jwt.sign({ email: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
                res.send({ token });
            }
        })

        // POST BILL DATA
        app.post('/api/add-billing', verifyJWT, async (req, res) => {
            const billingID = uuid.v4();
            const billData = new billCollection({
                billingID: billingID,
                fullname: req.body.fullname,
                email: req.body.email,
                phone: req.body.phone,
                payable: req.body.payable,
                phone: req.body.phone
            });
            try {
                const savedBillData = await billData.save();
                res.send(savedBillData);
            } catch (error) {
                res.status(400).send(error);
            }
        })

        // GET BILL DATA
        app.get('/api/billing-list', verifyJWT, async (req, res) => {
            const billingData = await billCollection.find();
            res.send(billingData);
        })

    } finally {

    }
}
run().catch(err => {
    console.error(err);
})

app.get('/', (req, res) => {
    res.send(`
    <p>
        <h1>Power hack server is running</h1>
    </p>
  `)
})

app.listen(port, () => {
    console.log(`Power hack app listening on port ${port}`)
})

//Export the express api
module.exports = app;