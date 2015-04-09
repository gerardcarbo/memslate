var express = require('express');
var log     = require('./config');
var _       = require('lodash');

module.exports = function (model, resource, options)
{
    options = options || {};

    var router = express.Router();

    router.get('/' + resource, options.getAll || function (req, res, next)
    {
        var select = '*';
        if (req.query.select) {
            select = req.query.select;
            delete req.query['select'];
        }

        _.extend(req.query,req.params); //extend query with URL params

        model.query({
            select: select
        }).where(req.query).fetchAll().then(function (collection) {
            res.json(collection);
        });
    });

    router.get('/' + resource + "/:id", options.get || function (req, res, next)
    {
        new model(req.params).fetch().then(function (result) {
                res.json(result);
            });
    });

    router.post('/' + resource, function (req, res, next)
    {
        if (options.pre_save)
        {
            options.pre_save(req, res, function (item)
            {
                var p=save_item(item, res);
                p.then(function(itemSaved)
                {
                    log.debug('router.post '+resource+' id:'+itemSaved.id);
                    if(options.post_save)
                    {
                        if(itemSaved)
                        {
                            options.post_save(req,res,itemSaved);
                        }
                        else
                        {
                            options.post_save(req,res);
                        }
                    }
                });
            });
        } else {
            save_item(req.body, res);
        }
    });

    function save_item(item, res)
    {
        return new model(item).save().then(function (row) {
            res.json(row);
            return row;
        }).catch(function (err) {
            console.log(err);
            res.status(500).send(err);
            return false;
        });
    };

    router.delete('/' + resource + "/:id", options.delete || function (req, res, next)
    {
        if (options.pre_delete)
        {
            options.pre_delete(req, res, function (item)
            {
                delete_item(item, res).then(function(itemDeleted)
                {
                    if(itemDeleted)
                    {
                        log.debug('router.delete '+resource+' id:'+itemDeleted.id);
                        if(options.post_delete)
                        {
                            options.post_delete(req,res,itemDeleted,function(){
                                res.json({error: false, data: {id:itemDeleted.id, message: 'Successfully deleted'}});
                            });
                        }
                        else
                        {
                            res.json({error: false, data: {id:itemDeleted.id, message: 'Successfully deleted'}});
                        }
                    }
                });
            });
        } else {
            delete_item(req.params, res);
        }
    });

    function delete_item(item,res)
    {
        return new model(item)
        .fetch({require: true})
        .then(function (modelItem) {
            var id=modelItem.get('id');
            return modelItem.destroy()
                .then(function () {
                    return item;
                })
                .otherwise(function (err) {
                    res.status(500).json({error: true, data: {message: err.message}});
                    return false;
                });
        })
        .otherwise(function (err) {
            res.status(500).json({error: true, data: {message: err.message}});
            return false;
        });
    };

    return router;
};