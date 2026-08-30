const express = require('express');
//const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path =  require('path');

// Initialize Express
const app = express();
//app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, './build')))
// Connect to MongoDB
const mclient=require('mongodb').MongoClient

mclient
  .connect(
    `${process.env.MONGODB_URI}`
  )
  .then((dbRef) => {
    const dbObj = dbRef.db("saas_web");
    const contactCollection = dbObj.collection("contact");
    app.set("contactCollectionObj",contactCollection)
    const supportCollection = dbObj.collection("support");
    app.set("supportCollectionObj",supportCollection)
    const signupCollection = dbObj.collection("signup");
    app.set("signupCollectionObj",signupCollection)
    console.log("Connection to saas DB - Success");
  })
  .catch((err) => console.log("Connection to saas DB - Failed",err));




// API endpoint to receive and save data to MongoDB
app.post('/api/contact/submit', async (req, res) => {
    const contact = req.body;
  
    try {
      const contactCollectionObj=app.get("contactCollectionObj");

      await contactCollectionObj.insertOne(contact)

  
      res.json({ success: true, message: "Data and validation result saved successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to save data." });
    }
  });
app.post('/api/support/submit', async (req, res) => {
    const support = req.body;
    try {
      const supportCollectionObj=app.get("supportCollectionObj");
      await supportCollectionObj.insertOne(support)

      res.json({ success: true, message: "Signed up successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to save data." });
    }
  });

  app.post('/api/login/submit', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const signupCollectionObj = app.get("signupCollectionObj");
      const user = await signupCollectionObj.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
  
      // For security, you should hash passwords and compare the hash in production
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid password." });
      }
  
      res.json({ success: true, message: "Login successful!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to login." });
    }
  });

  app.post('/api/signup/submit', async (req, res) => {
    const signup = req.body;
    try {
      const signupCollectionObj=app.get("signupCollectionObj");
      await signupCollectionObj.insertOne(signup)

      res.json({ success: true, message: "Data and validation result saved successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to save data." });
    }
  });
// Start the server
const port = process.env.PORT||5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});





