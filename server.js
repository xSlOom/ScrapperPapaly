var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');
var express = require('express');
var app     = express();
var papaly  = {};


var options = {
    url: 'https://papaly.com/login.json',
    followAllRedirects: true,
    method: 'POST',
    form: {
        'user[email]': '',
        'user[password]': ''
    }
};

app.get("/", function(req, res) {
    fs.readFile("index.html", function(e, r) {
        console.log((e ? "File not found": "Ok"));
        res.end(r);
    })
});

app.post("/", function (req, res) {
    request(options, function (error, response, body) {
        if ((!error) && (response.statusCode == 200)) {
            var data = {
                url : 'https://papaly.com',
                headers: {
                    'Cookie': response.headers['set-cookie']
                }
            };
            request(data, function(err, ress, bod) {
                var $ = cheerio.load(bod);
                $('div.cards-container > div.category-slot > div.category-container > div.card').each(function() {
                    var title = $(this).attr('category-name').replace(/ /g, '');
                    papaly[title] = [];
                    $('a', this).each(function() {
                        papaly[title].push($(this).attr('href'));
                    });
                });
                var news = JSON.stringify({
                    "papaly": [
                        papaly
                    ]
                }, null, 4);
                fs.writeFile('data.txt', news, function(err, resss) {
                    res.send((err ? "Failed to save data" : "Success"));
                });
            });
        }
    });
});

app.listen(3000, function() {
    console.log("Starting!");
});
