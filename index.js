const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()

//port of the server
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1qjysd6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        
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