const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 4000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
//middleware setup
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Jubair's Server is Running Here!!!!!");
});

const uri =
  "mongodb+srv://progresswave-admin:llJRgUuON8Ma4OXa@cluster0.udnr6tc.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//verify JWT middle ware
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "UnAuthorized Access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "UnAuthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    // Send a ping to confirm a successful connection

    //collections
    const userCollection = client.db("wave-db").collection("users");
    //boardCollection
    const boardCollection = client.db("wave-db").collection("boards");
    //ListCollection
    const listCollection = client.db("wave-db").collection("lists");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // post all users api when create a new user on website
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User is Alrady Exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.post("/boards", async (req, res) => {
      const body = req.body;
      //body valided
      if (!body) {
        return res
          .status(404)
          .send({ message: "Your Boards Data isn't Found.." });
      }
      const result = await boardCollection.insertOne(body);
      res.send(result);
    });
    app.post("/lists", async (req, res) => {
      const body = req.body;
      //body valided
      if (!body) {
        return res
          .status(404)
          .send({ message: "Your lists Data isn't Found.." });
      }
      const result = await listCollection.insertOne(body);
      res.send(result);
    });
    app.get("/lists/:email", async (req, res) => {
      const body = req.params.email;

      const result = await listCollection.find({ userMail: body }).toArray();

      res.send(result);
    });
    app.get("/boards/:email", async (req, res) => {
      const body = req.params.email;

      const result = await boardCollection.find({ userMail: body }).toArray();

      res.send(result);
    });
    app.delete("/boards/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await boardCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Your Server is Running on PORT : ${PORT}`);
});
