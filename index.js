const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express()

const corsOptions = {
    origin: [
        'http://localhost:5173',
    'http://localhost:5174',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyujvjv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const foodsCollection = client.db('foodBridge').collection('foods')
    const reqCollection = client.db('foodBridge').collection('requestedFood')

    app.get('/foods', async(req, res)=>{
        const result = await foodsCollection.find().toArray()
        res.send(result)
    })

    // add a food / post to collection
    app.post('/addFood', async(req, res)=>{
      const food = req.body
      const result = await foodsCollection.insertOne(food)
      res.send(result)
    })
    
    // single food details
    app.get('/food/:id', async(req, res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await foodsCollection.findOne(query)

        res.send(result)
    })

    app.get('/featured', async(req, res)=>{
        const result = await foodsCollection.find().sort({ foodQuantity: -1 }).limit(6).toArray();

        res.send(result)
    })

    // my req food
    app.put('/reqFood/:id', async(req, res)=>{
      const id = req.params.id
      const requestedFood = req.body;
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updateFood = {
        $set:{
          ...requestedFood
        }
      }
        const result = await foodsCollection.updateOne(query, updateFood, options);
        res.send(result)
        console.log(result);
    })

    app.get('/myFoodReq/:email', async(req, res)=>{
      const email = req.params.email;
      const query = { requester: email }
      const result = await foodsCollection.find(query).toArray()
      console.log(result);
      res.send(result)
    })


    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=>{
    res.send('Food Bridge is connected')
})

app.listen(port, ()=>{
    console.log('Food Bridge is running on port:', port)
})