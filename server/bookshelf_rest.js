"use strict";

var express = require('express');
var log     = require('./config');
var _       = require('lodash');

module.exports = function (Model, resource, options)
{
    options = options || {};

    var router = express.Router();

    router.get('/' + resource, options.getAll || function (req, res)
    {
        var select = '*';
        if (req.query.select) {
            select = req.query.select;
            delete req.query.select;
        }

        _.extend(req.query,req.params); //extend query with URL params

        Model.query({
            select: select
        }).where(req.query).fetchAll().then(function (collection) {
            res.json(collection);
        });
    });

    router.get('/' + resource + "/:id", options.get || function (req, res)
    {
        new Model(req.params).fetch().then(function (result) {
                res.json(result);
            });
    });


    function saveItem(item, res)
    {
        return new Model(item).save().then(function (row) {
            res.json(row);
            return row;
        }).catch(function (err) {
            console.log(err);
            res.status(500).send(err);
            return false;
        });
    }

    router.post('/' + resource, function (req, res)
    {
        if (options.preSave)
        {
            options.preSave(req, res, function (item)
            {
                saveItem(item, res).then(function(itemSaved)
                {
                    log.debug('router.post ' + resource + ' id:' + itemSaved.id);
                    if(options.postSave)
                    {
                        if(itemSaved)
                        {
                            options.postSave(req, res, itemSaved.attributes);
                        }
                        else
                        {
                            options.postSave(req, res);
                        }
                    }
                });
            });
        } else {
            saveItem(req.body, res);
        }
    });


    function deleteItem(item,res)
    {
        return new Model(item)
            .fetch({require: true})
            .then(function (modelItem) {
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
    }

    router.delete('/' + resource + "/:id", options.delete || function (req, res)
    {
        if (options.preDelete)
        {
            options.preDelete(req, res, function (item)
            {
                deleteItem(item, res).then(function(itemDeleted)
                {
                    if(itemDeleted)
                    {
                        log.debug('router.delete ' + resource + ' id:' + itemDeleted.id);
                        if(options.postDelete)
                        {
                            options.postDelete(req, res, itemDeleted,function(){
                                res.json({error: false, data: {id: itemDeleted.id, message: 'Successfully deleted'}});
                            });
                        }
                        else
                        {
                            res.json({error: false, data: {id: itemDeleted.id, message: 'Successfully deleted'}});
                        }
                    }
                });
            });
        } else {
            deleteItem(req.params, res);
        }
    });


    return router;
};
