var express = require('express');
var app = express();

var dbConnString = process.env.DATABASE_URL || 'postgres://oqlchoggseoylk:UGLF4yjNaTdbhupC99bVgpSRfN@ec2-54-243-250-125.compute-1.amazonaws.com:5432/dbicgtbctif1ok';
var pg = require('pg');

app.configure(function(){

    app.get('/', function(req, res){
        var client = new pg.Client(dbConnString);
        client.connect();

        res.json({
            artistID: 386,
            artistName: "Paul Oakenfold",
            songID: 25417373,
            songName: "Ready Steady Go"
        });
        res.end();
    });

    app.get('/_setup_db', function(req, res){
        var client = new pg.Client(dbConnString);
        client.connect();
        query = client.query('CREATE TABLE song_queue (' +
                                'id bigserial primary key,' +
                                'artist_id integer,' +
                                'artist_name varchar(150),' +
                                'song_id integer,' +
                                'song_name varchar(150)' +
                                ');');
        query.on('end', function() {
            fixture_query = client.query("INSERT INTO song_queue (artist_id, artist_name, song_id, song_name) VALUES " +
                "(386, 'Paul Oakenfold', 25417373, 'Ready Steady Go')");
            fixture_query.on('end', function(){
                client.end();
                res.send('Done');
            });
        });
    });

    app.use('/client', express.static(__dirname + '/client/'));

    app.use(express.logger());
    app.use(express.compress());
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Darn! The gnomes appear to have gone on a break and stuff is going wrong...');
    });

});


var port = process.env.PORT || 8000;
app.listen(port);
console.log('Listening on port ' + port);