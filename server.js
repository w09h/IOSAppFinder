/**
 * Created by omx on 1/1/2015.
 */
//server.js

//setup ===================
var express = require('express');
var app = express(); //create our app with express
var MongoClient = require('mongodb').MongoClient;


// configs =======================
var dataCollection;
var db = MongoClient.connect('mongodb://localhost:27017/IOSAppFinder', function (err, db){
    if(err)
        throw err;
    console.log("connected to mongodb");
    myCollection = db.collection('IOSAppFinder');
});

// functions ============






//api

//basic get
app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    //todo update depricated class to sendFile w/ uppercase F (something new going on here...)
});


// get all data
app.get('/api/data', function(req, res) {

    // use mongoose to get all data in the database
    var output = myCollection.find(function(err, data) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(data); // return all data in JSON format
    });
    res.json('');
});

// listners ====================

app.listen(8080);
console.log("app listening on 8080");