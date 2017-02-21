var request     = require('request');
var cheerio     = require('cheerio');
var fs          = require('fs');
var express     = require('express');
var bodyParser  = require('body-parser');
var app         = express();
var papaly      = {};
var logged      = false;

app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res) {
    fs.readFile("index.html", function(e, r) {
        console.log((e ? "File not found": "Ok"));
        res.end(r);
    })
});

app.post("/login", function(req, res) {
    var options = {
        url: 'https://papaly.com/login.json',
        followAllRedirects: true,
        method: 'POST',
        form: {
            'user[email]': req.body.username,
            'user[password]': req.body.password
        }
    };
    fs.unlink('cookies.txt', function(errs, htm) {
        if (errs == null) {
            console.log('cookies.txt deleted');
        }
    });
    request(options, function (error, response, body) {
        var json = JSON.parse(body);
        if (json['error'] == null) {
            fs.writeFile('cookies.txt', response.headers['set-cookie'], function(err, html) {
                if(err == null) {
                    logged = true;
                    res.send({
                        message: 'You are now connected to papaly!',
                        error: false
                    });
                }
            });
        } else {
            res.send({
                message: 'Bad username/password!',
                error: true
            })
        }
    });
})

app.post("/", function (req, res) {
    if (logged == false) {
        res.send({
            message: "You must be connected to papaly",
            error: true
        })
    } else {
        fs.readFile('cookies.txt', function(errors, datas) {
            var data = {
                url: 'https://papaly.com',
                headers: {
                    'Cookie': datas
                }
            };
            request(data, function (err, ress, bod) {
                var $ = cheerio.load(bod);
                $('div.cards-container > div.category-slot > div.category-container > div.card').each(function () {
                    var title = $(this).attr('category-name').replace(/ /g, '');
                    papaly[title] = [];
                    $('a', this).each(function () {
                        papaly[title].push($(this).attr('href'));
                    });
                });
                var news = JSON.stringify({
                    "papaly": [
                        papaly
                    ]
                }, null, 4);
                fs.writeFile('data.txt', news, function (err, resss) {
                    res.send((err ? "Failed to save data" : news));
                });
            });
        });
    }
});

app.listen(3000, function() {
    console.log("Starting!");
});