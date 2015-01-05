/**
 * Created by omx on 1/1/2015.
 */
//server.js

//setup ===================
var express = require('express');
var app = express(); //create our app with express
var url = require('url');
var stream = require('stream');
var fs = require('fs');
var https = require("https");
var async = require("async");

//var http = require('http').Server(app);
var server = app.listen(8080);
var io = require('socket.io').listen(server);
var MongoClient = require('mongodb').MongoClient;

// configs =======================

var counter =0;
var mongoCollection;
https.globalAgent.maxSockets = 1;

MongoClient.connect("mongodb://localhost:27017/IOSAppFinder", function(err, db) {
    if(!err) {
        console.log("We are connected to Mongo! /IOSAppFinder");
        mongoCollection = db.collection('apps');
    }
});

//app.get('/stream', function(req, res){
//    res.sendFile(__dirname + '/stream.html');
//});

io.on('connection', function(socket){

    io.emit('chat message', 'connected!');
    socket.on('chat message', function(msg){
        console.log(msg
        );
        io.emit('chat message', msg);
    });
});

// functions ============



// Utility function that downloads a URL and invokes
// callback with the data.



var timer =0;
function test(input){
    console.log("delay call : " + timer + input);
}

function download(url, callback) {

   timer = timer + 100;
    setTimeout(getData, timer, url, callback);
}

function getData(url, callback){

    var returnValue = null;

    https.get(url, function(res) {
        var data = "";
   //     console.log("statusCode: ", res.statusCode);
        if (res.statusCode != 200)
            {
        console.log("headers: ", res.headers);
        }
        console.log(counter);
        counter++;
        io.emit('chat message', ( url));

        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function(e) {
        console.log("Data is null!" + e.message);// + res.url); //+// e.message);
        console.log("adding back to queue");
        //console.log(https.globalAgent.sockets)

        callback(null);

    })


}

function stripURLS(input){
    var urlMatcher = /https:\/\/itunes\.apple\.com\/us\/app[^?]*/gi;
    var urls = input.match(urlMatcher).toString();
    //console.log(res);
    var idMatcher = /id[0-9]+/gi;
    var ids = urls.match(idMatcher);
    //console.log(ids);
    updateMongoWithIDs(ids);
    //now update mongodb entry for this ID with apple fetch

}

function updateMongoWithIDs(ids){
    //example call
    //https://itunes.apple.com/lookup?id=910409599
    var url;
    var idChain = "";
    var chains = [];

    for(var i in ids) {
    idChain = idChain + ids[i].substr(2) + ",";
        if(i %180 ==0 && i >1){
            idChain = idChain.substr(0,idChain.length-1);
            chains.push(idChain);
            idChain = "";
        }

    }
    console.log("=====");
    idChain = idChain.substr(0,idChain.length-1);
    chains.push(idChain);
    console.log(chains);
    console.log("=====");

    for(var i in chains){
       // console.log(ids[i]);
        url = "https://itunes.apple.com/lookup?id=" + chains[i];
        console.log(url);
           // io.emit('chat message', url);
            //next steps make fetch call, send updates to mongo
//    console.log(ids[i].substr(2));
        //if(i < 10) {

        //async retry the download 5 times
        //ideal, if data == null, then rety
        async.retry(5,
        download(url, function (data) {
                //console.log(data);

                if (data) {
                    //console.log(data);
                    var rawJSON = JSON.parse(data);
                    //keep all fields (possible tuning point: could store only half fields)
                    var result = rawJSON['results'];
               //     console.log("========");
               //     console.log(result);
               //     console.log("========");

                    //add to mongo
                    for(var i in result){
                        console.log("json result counter" + i);

                        if(result != null && result.length >5) {
                            mongoCollection.insert(result[i], function (err, result) {
                                //if(!err.contains("duplicate key error"))
                                console.log(err);
                            });
                        }

                    }



                }
                else console.log("no data found element: ");

            }) );

        //}
    }
    //console.log('updates complete');
}


//api

//basic get
app.get('/', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    //todo update depricated class to sendFile w/ uppercase F (something new going on here...)
});


// get all data
app.get('/stream', function(req, res) {

    //==================
    //Issue: repeated calls going to console, possible repeated api calls
    //=================


    var url = "http://www.dailymail.co.uk/news/article-2297585/Wild-squirrels-pose-charming-pictures-photographer-hides-nuts-miniature-props.html"
    var rawString = "";

    for(var i=80; i <=80; i++){ //ascii counter A-Z inclusive 65..90
        for(var j=1; j <199; j++){ //pages 1..199
            var urlString = "https://itunes.apple.com/us/genre/ios-games/id6014?mt=8&letter=" + String.fromCharCode(i) + "&page=" + j + "#page";
            //console.log(urlString);
            url = urlString;

            async.retry(5,
            download(url, function(data) {
                if (data) {
                     //console.log(data);
                     rawString = data;
                    stripURLS(data);
                    //console.log(url);
                }
                else console.log("no data found : " );
            }));


        }}



    res.sendfile('stream.html');
    //res.json('{request:success}');
});

