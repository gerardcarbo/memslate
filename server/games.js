/**
 * Created by gerard on 22/07/2015.
 */
var config = require('./config');
var url = require("url");
require('../ionic/www/js/utils');

module.exports = function (bookshelf,models) {
    "use strict";
    function getAll(req, res) {
        models.Games.query({
            select: '*'
        }).fetchAll().then(function(games){
            if(games)
            {
                res.json(games);
            }
            else
            {
                res.json(false);
            }
        })
    };

    function get(req,res) {
        console.log("Games.get", req.url);
        var gameName = req.params.name_id;

        models.Games.query({
            select: '*'
        }).where({name_id:gameName}).fetch().then(function(game){
            if(game)
            {
                console.log("Games.get: getting game: "+game.get('name')+" -> "+game.get('name_id'));
                var gameName = './games/'+game.get('name_id')+'/'+game.get('name_id');
                var game = require(gameName)(bookshelf, models);

                game.get(req,res);
            }
            else
            {
                res.json(false);
            }
        });
    };

    return {
        getAll: getAll,
        get: get
    };
};