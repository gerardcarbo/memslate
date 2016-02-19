"use strict";

var express = require('express');
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
            console.log('post ' + resource + ' id:' + row.get('id'));
            return row;
        }).catch(function (err) {
            console.log('post ' + resource + ' error:',err);
            res.status(500).send(err);
            return false;
        });
    }

    function notifyItemSaved(res, itemSaved){
        if(itemSaved)
        {
            res.json(itemSaved);
        }
    }

    router.post('/' + resource, function (req, res)
    {
        if (options.preSave)
        {
            options.preSave(req, res, function (item)
            {
                saveItem(item, res).then(function(itemSaved)
                {
                    notifyItemSaved(res, itemSaved);

                    if(options.postSave)
                    {
                        if(itemSaved)
                        {
                            options.postSave(req, res, itemSaved);
                        }
                        else
                        {
                            options.postSave(req, res);
                        }
                    }
                });
            });
        } else {
            saveItem(req.body, res).then(function (itemSaved){
                notifyItemSaved(res, itemSaved);
            });
        }
    });

    function deleteItem(item,res)
    {
        return new Model(item)
            .fetch({require: true})
            .then(function (modelItem) {
                return modelItem.destroy()
                    .then(function () {
                        console.log('deleteItem ' + resource + ' id:' + item.id);
                        return item;
                    })
                    .otherwise(function (err) {
                        console.log('deleteItem destroy error:', err);
                        res.status(500).json({error: true, data: {message: err.message}});
                        return false;
                    });
            })
            .otherwise(function (err) {
                console.log('deleteItem fetch error:', err);
                res.status(500).json({error: true, data: {message: err.message}});
                return false;
            });
    }

    function notifyItemDeleted(res, itemDeleted){
        if(itemDeleted)
        {
            res.json(itemDeleted);
        }
    }

    router.delete('/' + resource + "/:id", options.delete || function (req, res)
    {
        if (options.preDelete)
        {
            options.preDelete(req, res, function (item)
            {
                deleteItem(item, res).then(function(itemDeleted)
                {
                    notifyItemDeleted(res, itemDeleted);

                    if(options.postDelete)
                    {
                        if(itemDeleted) {
                            options.postDelete(req, res, itemDeleted.attributes);
                        }
                        else
                        {
                            options.postDelete(req, res);
                        }
                    }
                });
            });
        } else {
            deleteItem(req.params, res).then(function(itemDeleted)
            {
                notifyItemDeleted(res, itemDeleted);
            });
        }
    });

    return router;
};
