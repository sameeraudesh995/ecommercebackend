const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { error, log } = require("console");

require('dotenv').config();
const token = jwt.sign(data, process.env.JWT_SECRET);
const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://sameera:12345@cluster0.kb2adzg.mongodb.net/ecommerce?appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error: " + err));

app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({storage:storage})

// Create Upload Endpoint for images
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for Creating products

const Product = mongoose.model("Product",{
    id:{
        type:Number,
        require:true,
    },
    name:{
        type:String,
        require:true,
    },
    image:{
        type:String,
        require:true,
    },
    category:{
        type:String,
        require:true,
    },
    discription:{
        type:String,
        require:true,
    },
    new_price:{
        type:Number,
        require:true,
    },
    old_price:{
        type:Number,
        require:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    avilable:{
        type:Boolean,
        default:true,
    }

})

app.post('/addproduct', async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }

    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        discription:req.body.discription,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// creating API  for deleting product

app.post('/removeproduct', async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed")
    res.json({
        success:true,
        name:req.body.name,
    })
})

// creating API for geting all product

app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({})
    console.log("All Product Fetched")
    res.send(products);
})

//Schema create for user model
const Users = mongoose.model('Users',{
    name:{
        type:String,

    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// creating end point fir registering the user
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// ── Signup ──
app.post('/signup', async (req, res) => {
  try {
    // check if user already exists
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists."
      });
    }

    // ✅ encrypt password before saving
    const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

    // build default cart
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }

    // create user with hashed password
    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: hashedPassword,        // ✅ save hashed, never plain text
      cartData: cart,
    });

    await user.save();

    // generate token
    const data = { user: { id: user.id } };
    const token = jwt.sign(data, 'secret_ecom');

    res.json({ success: true, token });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
});

// ── Login ──
app.post('/login', async (req, res) => {
  try {
    // find user by email
    let user = await Users.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ success: false, error: "No account found with this email." });
    }

    // ✅ compare entered password with hashed password in DB
    const passCompare = await bcrypt.compare(req.body.password, user.password);
    if (!passCompare) {
      return res.json({ success: false, error: "Incorrect password. Please try again." });
    }

    // generate token
    const data = { user: { id: user.id } };
    const token = jwt.sign(data, 'secret_ecom');

    res.json({ success: true, token });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
});
//creating endpoint for new collection

app.get('/newcollections', async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched")
    res.send(newcollection);
})

//creating end point popular in women category

app.get('/popularingov', async (req, res) => {
    let products = await Product.find({ category:"GOV"});
    let popular_in_gov = products.slice(0, 4);
    console.log("Popular in women fetch");
    res.send(popular_in_gov);
});

//creating middleware to fetch user
const fetchUser = async(req, res, next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try{
            const data = jwt.verify(token,'secret_ecom')
            req.user = data.user;
            next();
        }catch(error){
            res.status(401).send({errors:'please authentificate using a valid token'})
        }
    }
}

//creating endpoint for adding product in cart data

app.post('/addtocart',fetchUser, async (req, res)=>{
    //console.log(req.body, req.user);
    console.log("Added", req.body.itemId)
    let userData = await Users.findOne({_id:req.user.id})
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

//creating endpoint to remove product from cart data

app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("Removed", req.body.itemId)
     let userData = await Users.findOne({_id:req.user.id})
     if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

//get cart data

app.post('/getcart', fetchUser, async (req, res) => {
  console.log('Get cart');
  try {
    let userData = await Users.findOne({ _id: req.user.id });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userData.cartData);

  } catch (error) {
    console.error('Get cart error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server running on Port " + port);
    } else {
        console.log("Error: " + error);
    }
});