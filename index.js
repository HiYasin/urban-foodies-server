const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors(
  {
    origin: ['http://localhost:5173'], //replace with client address
    credentials: true,
  }
));

// cookie parser middleware
app.use(cookieParser());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.alvdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const database = client.db('urbanFoodiesDB');

    // auth related apis
    app.post('/jwt', (req, res) => {
      const user = req.body;
      //create token
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
          // secure: process.env.NODE_ENV === 'production',
          // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true })
    })

    //add food
    app.post('/foods', async (req, res) => {
      const foodCollection = database.collection('foods');
      const foodItem = req.body;
      const result = await foodCollection.insertOne(foodItem);

      // ...existing code...      res.send(result);
    });

    //get all foods
    app.get('/foods', async (req, res) => {
      const foodCollection = database.collection('foods');
      const cursor = foodCollection.find();
      const foods = await cursor.toArray();
      res.send(foods);
    })

    //get single food details
    app.get('/foods/:id', async (req, res) => {
      const foodCollection = database.collection('foods');
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const food = await foodCollection.findOne(query);
      res.send(food);
    })

    //get specific users foods
    app.get('/food', async (req, res) => {
      const email = req.query.email;

      query = { 'adder_email': email };

      console.log(email);

      const foodCollection = database.collection('foods');
      const cursor = foodCollection.find(query);
      const foods = await cursor.toArray();
      if (foods) {
        res.send(foods);
      } else {
        res.send('food not found')
      }

    });

    // Update food info
    app.put('/update', async (req, res) => {
      const updatedData = req.body;
      const id = updatedData._id;
      delete updatedData._id;
      //console.log(updatedData);
      ///console.log(id);



      const foodCollection = database.collection('foods');
      const filter = { _id: new ObjectId(id) };
      const update = { $set: updatedData };


      const result = await foodCollection.updateOne(filter, update);

      // console.log('Update result:', result);

      if (result.modifiedCount > 0) {
        res.send({ message: 'Food updated successfully' });
      } else {
        res.status(404).send({ message: 'No food found with the given ID' });
      }
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from my server')
})



app.listen(port, () => {
  console.log('My simple server is running at', port);
})