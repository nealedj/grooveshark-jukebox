document.write('<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>');
document.write('<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min.js"></script>');

(function ($) {

    Song = Backbone.Model.extend({
        name: null
    });

    Playlist = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.bind("add", options.view.songAdded);
        }
    });

    AppView = Backbone.View.extend({
        el: $("#sidebar"),
        initialize: function () {
            this.$el.html( "<button id='addSong'>Add Song</button>");
            this.playlist = new Playlist( null, { view: this });
        },
        events: {
            "click #addSong":  "addSong"
        },
        addSong: function (id) {
            id = 33;
            var song_model = new Song({ id: id });
            this.playlist.add( song_model );
        },
        songAdded: function (model) {
            alert(model.get('id') + ' added!')
        }
    });

    var appview = new AppView;

})(jQuery);