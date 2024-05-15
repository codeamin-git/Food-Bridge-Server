const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const app = express()

const corsOptions = {
    origin: [
        'http://localhost:5173',
    'http://localhost:5174',
    'https://food-bridge-59aa8.web.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const logger = async(req, res, next) => {
  console.log('called:', req.host, req.originalUrl);
  next()
}

    // verify jwt middleware
    const verifyToken = (req, res, next)=>{
      const token = req.cookies?.token
      if(!token) return res.status(401).send({message: 'unauthorized access'})
      if(token){
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
          if(err){
            console.log(err);
            return res.status(401).send({message: 'unauthorized access'})
          }
          req.user = decoded
          next()
        })
      }
    }

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

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};


async function run() {
  try {

    const foodsCollection = client.db('foodBridge').collection('foods')

    //creating Token
app.post("/jwt", logger, async (req, res) => {
  const user = req.body;
  console.log("user for token", user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

  res.cookie("token", token, cookieOptions).send({ success: true });
});

//clearing Token
app.post('/logout', async (req, res) => {
  const user = req.body;
  console.log('logging out', user);
  res
  .clearCookie('token', {
          maxAge: 0, sameSite: 'none', secure: true
        })
  .send({ success: true })
  })





    // all foods
    app.get('/foods', async(req, res)=>{
        const result = await foodsCollection.find().toArray()
        res.send(result)
    })

    app.get('/availableFoods', async(req, res)=>{
      const status = {foodStatus: 'available'}
      const result = await foodsCollection.find(status).toArray()
      res.send(result)
    })

    // add a food / post to collection
    app.post('/addFood', verifyToken, async(req, res)=>{
      const food = req.body
      const result = await foodsCollection.insertOne(food)
      res.send(result)
    })

    app.put('/update/:id', async(req, res)=>{
      const id = req.params.id;
    const updatedInfo = req.body;
    const query = { _id: new ObjectId(id) };
    const options = { upsert: true };

    delete updatedInfo._id;
    
    const updatedFood = {
        $set: updatedInfo
    };
        const result = await foodsCollection.updateOne(query, updatedFood, options);
        res.send(result)
   })

   app.delete('/food/:id', async(req, res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await foodsCollection.deleteOne(query)
    res.send(result)
   })
    
    // manage my foods page api
    app.get('/manageMyFoods/:email',verifyToken, async(req, res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email;
      if(tokenEmail !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { donatorEmail: email }
      const result = await foodsCollection.find(query).toArray()
      res.send(result)
    })
    
    // single food details
    app.get('/food/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await foodsCollection.findOne(query)

        res.send(result)
    })

    // featured food section api
    app.get('/featured', async(req, res)=>{
        const result = await foodsCollection.find().sort({ foodQuantity: -1 }).limit(6).toArray();

        res.send(result)
    })

    // my req food
    app.put('/reqFood/:id', verifyToken, async(req, res)=>{
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
    })

    app.get('/myFoodReq/:email', verifyToken, async(req, res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email;
      if(tokenEmail !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { requester: email }
      const result = await foodsCollection.find(query).toArray()
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