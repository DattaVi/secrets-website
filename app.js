require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: 'this is a secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const usc=new mongoose.Schema({
    username:String,
    password:String,
    secret:String
})

usc.plugin(passportLocalMongoose);
usc.plugin(findOrCreate);

const User=new mongoose.model("user",usc);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
})






passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



app.get("/",function(req,res){
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
    res.render("login");
})


app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}}).then(function(result){
    res.render("secrets",{usec:result});
  })
})

app.get("/submit",function(req,res){
  console.log("entered secrets");
  if(req.isAuthenticated()){
    console.log("rendered");
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
})


app.post("/submit", function(req, res) {
  var us = req.body.secret;
  User.findOne({_id: req.user._id}).then(function(result) {
    if (!result) { // check if result is null
      result = new User({_id: req.user._id, secret: us}); // create a new user object
    } else {
      result.secret = us;
    }
    result.save().then(function(re) {
      res.redirect("/secrets");
    })
  }).catch(function(err) {
    console.log(err);
  });
});


app.get("/logout",function(req,res){
  res.redirect("/");
})




app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      console.log("entered register");
      passport.authenticate("local")(req, res, function() {
        console.log("authenticated");
        res.redirect("/secrets");
      });
    }
  });
});


app.post("/login",function(req,res){
const u=new User({
  username:req.body.username,
  password:req.body.password
})

req.login(u,function(err){
  if(err)
  console.log(err);
  else{
    passport.authenticate("local" )(req,res,function(){
      console.log("authenticated");
      res.redirect("/secrets");
      l=1;
    })
  }
})
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// app.post("/register",function(req,res){
//   const newuser=new User({
//     username:req.body.username,
//     password:req.body.password
//   });
 
//   User.register(newuser,req.body.password,function(err,user){
//     if(err){
//       console.log(newuser);
//       console.log(req.body.password);
//       console.log(err);
//       res.redirect("/register");
//     }
//     else{
//       passport.authenticate("local" )(req,res,function(){
//         console.log("authenticated");
//         res.redirect("/secrets");
//         l=1;
//       })
      
//     }
//   })
 
// })
//userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",