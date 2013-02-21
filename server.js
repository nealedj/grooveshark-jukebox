var express = require('express');
var app = express();

var dbConnString = process.env.DATABASE_URL || 'tcp://localhost:5432/grooveshark_jukebox';
var pg = require('pg');

app.configure(function(){
    app.use(express.logger());
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Darn! The gnomes appear to have gone on a break and stuff is going wrong...');
    });
    app.all('/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    app.use('/client', express.static(__dirname + '/client/'));

});


var port = process.env.PORT || 8000;
app.listen(port);
console.log('Listening on port ' + port);

app.get('/song_queue', function(req, res){
    var client = new pg.Client(dbConnString);
    client.connect();

    query = client.query("SELECT id, artist_id, artist_name, song_id, song_name, created FROM song_queue " +
        "WHERE popped = '0' " +
        "ORDER BY created DESC");

    query.on('row', function(row, result) {
        result.addRow(row);
    });

    query.on('end', function(result){
        res.json(result.rows);
    });
});

app.post('/song_queue', function(req, res){
    var client = new pg.Client(dbConnString);
    client.connect();

    var query = client.query("INSERT INTO song_queue(artist_id, artist_name, song_id, song_name, created, popped) " +
        "values($1, $2, $3, $4, NOW(), $5)",
        [req.body.artist_id, req.body.artist_name, req.body.song_id, req.body.song_name, '0']);

    query.on('end', function(){
        res.send('Done');
    });
});

app.post('/song_queue/pop', function(req, res){
    var client = new pg.Client(dbConnString);
    client.connect();

    var query = client.query("UPDATE song_queue SET popped='1' WHERE id=$1", [req.query["id"]]);

    query.on('end', function(){
        res.send('Done');
    });
});

app.get('/_setup_db', function(req, res){
    var client = new pg.Client(dbConnString);
    client.connect();
    client.query('DROP TABLE song_queue');
    query = client.query('CREATE TABLE song_queue (' +
        'id bigserial primary key,' +
        'artist_id integer,' +
        'artist_name varchar(150),' +
        'song_id integer,' +
        'song_name varchar(150),' +
        'created timestamp,' +
        'popped bool' +
        ');');

    fixture_query = client.query("INSERT INTO song_queue (artist_id, artist_name, song_id, song_name, created, popped) VALUES " +
        "(386, 'Paul Oakenfold', 25417373, 'Ready Steady Go', NOW(), '0')");
    fixture_query.on('end', function(){
        client.end();
        res.send('Done');
    });
});