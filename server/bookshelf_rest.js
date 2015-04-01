var express = require('express');

module.exports = function (model, resource, options) {
    options = options || {};

    var router = express.Router();
    router.get('/' + resource, function (req, res, next) {
        var select = '*';
        if (req.query.select) {
            select = req.query.select;
            delete req.query['select'];
        }
        model.query({
            select: select
        }).where(req.query).fetchAll().then(function (collection) {
            res.json(collection);
        });
    });

    router.get('/' + resource + "/:pkid", function (req, res, next) {
        var pkid = req.params.pkid;
        new model({
            id: pkid
        }).fetch().then(function (result) {
                res.json(result);
            });
    });

    function save_item(item, res) {
        return new model(item).save().then(function (row) {
            res.json(row);
            return row;
        }).catch(function (err) {
            console.log(err);
            res.status(500).send(err);
            return false;
        });
    };

    router.post('/' + resource, function (req, res, next) {
        if (options.pre_save) {
            options.pre_save(req, res, function (item) {
                var p=save_item(item, res)

                p.then(function(itemSaved){
                    if(itemSaved)
                    {
                        options.post_save(req,res,itemSaved);
                    }
                    if(options.post_save) {
                        options.post_save(req,res);
                    }
                });
            });
        } else {
            save_item(req.body, res);
        }


    });

    return router;
};