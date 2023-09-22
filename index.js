import express from "express";
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';


const uri = 'mongodb+srv://admin:admin@cluster0.y1laqzv.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp';
const client = new MongoClient(uri, {  });

async function connectToDatabase() {
    try {
      await client.connect();
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

connectToDatabase();

const app = express();
app.use(bodyParser.json());

//without database
let dataSementara = {};

app.get("/", async function (req, res) {
  res.send(dataSementara);
});

app.post("/", async function (req, res) {
  const newData = req.body;
  dataSementara = newData;
  res.send("OK");
});


async function hashPassword(password) {
    const saltRounds = 10; // Number of salt rounds (adjust as needed)
    return await bcrypt.hash(password, saltRounds);
}

//with database
app.post('/api/users', async (req, res) => {
    const response = {
        success:false, 
        message:"Server error"
    }
    try {
      const personData = req.body;
      const peopleCollection = client.db('gengdb').collection('users'); // Use the correct database and collection names
      
      //hash password
      const hashedPassword = await hashPassword(personData.password);
      personData.password = hashedPassword;
      
      const result = await peopleCollection.insertOne(personData);
      if(result.acknowledged == true) {
        response.success = true
        response.message = "Success"
      }
      
      // Remove the password field from the response
      delete personData.password;

      res.status(200).json(response); // Respond with the inserted person

    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json(response);
    }
  });
  
  // Retrieve all people (GET request)
app.get('/api/users', async (req, res) => {
    try {
      const peopleCollection = client.db('gengdb').collection('users'); // Use the correct database and collection names
      const people = await peopleCollection.find().toArray();
      res.status(200).json({
        data: people
      });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Server error' });
    }
});

// app.use(express.json());

// let dataSementara = {};

// // READ
// app.get("/", async function (req, res) {
//   res.send(dataSementara);
// });

// // CREATE
// app.post("/", async function (req, res) {
//   const newData = req.body;
//   dataSementara = newData;
//   res.send("OK");
// });

// // UPDATE
// app.put("/", async function (req, res) {
//   dataSementara = req.body;
//   res.send("Updated");
// });

// // DELETE
// app.delete("/", async function (req, res) {
//   dataSementara = {};
//   res.send("Deleted");
// });

app.listen(3000, () => console.log('Server Running at http://localhost:3000'))