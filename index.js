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
            const data = req.body;
            const billData = {
                billingID,
                email: data.email,
                fullname: data.fullname,
                payable: data.payable,
                phone: data.phone,
                date: data.date
            }            
            const result = await billCollection.insertOne(billData);
            res.send({ result, billData });
        })

        // UPDATE BILL DATA
        app.put('/api/update-billing/:id', verifyJWT, async (req, res) => {
            console.log(req.params)
            const id = req.params.id;
            const updatedData = req.body;
            const data = {
                fullname: updatedData.fullname,
                email: updatedData.email,
                date: updatedData.date,
                payable: updatedData.payable,
                phone: updatedData.phone,
            }

            const result = await billCollection.updateOne({ billingID: id }, { $set: data });

            if (result.modifiedCount > 0) {
                res.status(200).send({updatedData, result});
                // res.send(result)
            } else {
                res.status(404).send({ message: 'Data not found' });
            }
        });
        
        // GET BILL DATA
        app.get('/api/billing-list/:page', verifyJWT, async (req, res) => {
            const page = parseInt(req.params.page);
            const query = {};
            const limit = 10;
            const billingCount = await billCollection.countDocuments(query);
            const totalPages = Math.ceil(billingCount / limit);
            const result = await billCollection
                .find(query)
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();
            res.send({ result, totalPages });
        });

        // DELETE BILL DATA
        app.delete('/api/delete-billing/:id',verifyJWT, async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await billCollection.deleteOne(query)
            res.send(result);
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