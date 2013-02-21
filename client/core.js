
(function ($) {
    Song = Backbone.Model.extend({
        id: null,
        artist_id: null,
        artist_name: null,
        song_id: null,
        song_name: null

    });

    Playlist = Backbone.Collection.extend({
        url: 'http://localhost:8000/song_queue'
    });

    AppView = Backbone.View.extend({

        el: $("#sidebar"),
        pollFrequency: 8000,
        initialize: function () {
            this.$el.html( "<h1>Jukebox Mode</h1>");
            this.playlist = new Playlist( null, { view: this });
            _.bindAll(this);
            var poller = Backbone.Poller.get(this.playlist, {
                delay: this.pollFrequency
            });
            poller.on('success', this.songsAdded);
            poller.start();
        },
        songAdded: function (model, first) {
            this.addToPlaylist(model, first);
            $.ajax(this.playlist.url + '/pop?id=' + model.get('id'), {
                type: 'POST',
                async: false
            });
        },
        songsAdded: function(o){
            var view = this;
            var first =  window.Grooveshark.getCurrentSongStatus().status == 'none';
            _.each(o.models, function(model){
                view.songAdded(model, first);
                first = false;
            });
        },

        addToPlaylist: function(song, first){
            window.Grooveshark.addSongsByID([song.get('song_id')], first);
        }
//        songsReset: function(o){
//            var view = this;
//            this.goToEnd(function(){
//                var first = window.Grooveshark.getCurrentSongStatus().status == 'none';
//                _.each(o.models, function(model){
//                    view.addToPlaylist(model, first);
//                    first = false;
//                });
//            });
//        },



//        goToEnd: function(callback){
//            if(window.Grooveshark.getCurrentSongStatus().status == 'none'){
//                return callback();
//            }
//
//            var timer = window.setInterval(
//                function(){
//                    if(window.Grooveshark.getNextSong() !== null){
//                        window.Grooveshark.next();
//                    }
//                    else{
//                        clearInterval(timer);
//                        callback();
//                    }
//                }, 500
//            );
//        }
    });

    var appview = new AppView;

})(jQuery);