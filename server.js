var express = require("express");
var socket = require("socket.io");
const mongodb = require('mongodb');
var bodyParser = require('body-parser')
const moment = require('moment');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs')
app.use(express.static("public"));

const MongoClient = mongodb.MongoClient;
const uri = "mongodb+srv://akshata:akshata@cluster0-wrae7.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true }, { useUnifiedTopology: true});
var rooms=[]
var usernames = {};
var rooms = ["global", "td", "non td","web"];
var r;
app.get('/name',(req,res)=>{
  res.sendFile(__dirname + '/name.html')
  r=req.body.domain;
  rooms.push(req.body.domain)
  console.log(r)
})

app.post("/",(req,res)=>{
  rooms.push(req.body.domain)
  console.log(rooms)
})


app.get('/display', (req, res) => {
  res.sendFile(__dirname + '/i.html')
})

app.post("/oldme",(req,res)=>{
  MongoClient.connect(uri,{useUnifiedTopology : true},(err,db) => {
    if (err) throw err
     let dbp = db.db("atom")
     let query = {room:req.body.domain}
     dbp.collection("messages").find(query).sort({datefield: -1}).toArray((dbErr,result) => {
         if(dbErr) throw dbErr
      else
              res.render("in",{result:result})
    })
 })
})
var server = app.listen(5000, function() {
  console.log("Listening to port 5000.");
});

var io = socket(server);

// Global variables to hold all usernames and rooms created
var usernames = {};
var rooms = ["global", "td", "non td","web"];
var currentroom;
io.on("connection", function(socket) {
  console.log("User connected to server.");
  socket.on("createUser", function(username,domain) {
    /////console.log(req.body.domain)
    // console.log(domain)
    socket.username = username;
   // rooms.push(domain)
    MongoClient.connect(uri,{useUnifiedTopology : true},(err,db) => {
      if (err) throw err
       let dbp = db.db("atom")
       let query = {}
       dbp.collection("messages").find(query).toArray((dbErr,result) => {
           if(dbErr) throw dbErr
        else
        result.forEach((i)=>{
          if(i.room==currentroom)
              { 
                socket.emit("updateRoms",rooms,currentroom);
             }
         })
      })
   })
     usernames[username] = username;
     socket.currentRoom ="global" ;
     socket.join("global");
     socket.emit("updateChat", "INFO", "You have joined global room");
     socket.broadcast
      .to("global")
       .emit("updateChat", "INFO", username + " has joined global room");
     io.sockets.emit("updateUsers", usernames);
     socket.emit("updateRooms", rooms, "global");
  });


  socket.on("sendMessage", function(data) {
    io.sockets
      .to(socket.currentRoom)
      .emit("updateChat", socket.username, data);
      console.log(data);
       
      MongoClient.connect(uri,{useUnifiedTopology : true},(err,db)=>
      {        if(err) throw err
        var dbo=db.db('atom')
         var dat={message:JSON.stringify(data),
          user:socket.username,
          time: moment().format('YYYY-MM-DD HH:mm:ss'),
          room:socket.currentRoom
         }
          dbo.collection('messages').insertOne(dat, (dbErr,result) => {
            if(dbErr) 
           throw dberr;
          else
             console.log("msg send to db")
          })
  
      })


  });


  socket.on("createRoom", function(room) {
    if (room != null) {
     console.log(room);

      rooms.push(room);
      io.sockets.emit("updateRooms", rooms, null);
    }
  });


  socket.on("updateRooms", function(room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", socket.username + " left room");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "You have joined " + room + " room");
    socket.broadcast
      .to(room)
      .emit("updateChat", "INFO", socket.username + " has joined " + room + " room");
  });


  socket.on("disconnect", function() {
    delete usernames[socket.username];
    io.sockets.emit("updateUsers", usernames);
    socket.broadcast.emit("updateChat", "INFO", socket.username + " has disconnected");
  });


  
});