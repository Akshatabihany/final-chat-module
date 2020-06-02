const express = require('express');
const app = express();
const mongodb = require('mongodb');
const port=2000;
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.set('view engine', 'ejs')
const MongoClient = mongodb.MongoClient
const uri = "mongodb+srv://akshata:akshata@cluster0-5i0bk.mongodb.net/test?retryWrites=true&w=majority";


app.get('/display', (req, res) => {
    res.sendFile(__dirname + '/i.html')
  })
  
  
  app.post("/oldme",(req,res)=>{
    MongoClient.connect(uri,{useUnifiedTopology : true},(err,db) => {
      if (err) throw err
       let dbp = db.db("atom")
       let query = {room:"app"}
       dbp.collection("messages").find(query).toArray((dbErr,result) => {
           if(dbErr) throw dbErr
        else
        result.forEach((i)=>{
                res.render("in",{result:result})
         })
      })
   })
  })
     
      
app.listen(port, () => {
console.log(`Server running `)})
     