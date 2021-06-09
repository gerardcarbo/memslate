"use strict";

var express = require('express');
var _ = require('lodash');

module.exports = function (Model, resource, options) {
    options = options || {};

    var router = express.Router();

    router.get('/' + resource, options.getAll || function (req, res) {
        var select = '*';
        if (req.query.select) {
            select = req.query.select;
            delete req.query.select;
        }

        _.extend(req.query, req.params); //extend query with URL params

        Model.query({
            select: select
        }).where(req.query).fetchAll().then(function (collection) {
            res.json(collection);
        });
    });

    router.get('/' + resource + "/:id", options.get || function (req, res) {
        new Model(req.params).fetch({ require: false })
            .then(function (result) {
                if (result) {
                    res.json(result);
                } else {
                    res.status(404).send(resource + ' ' + req.params + ' not found');
                }
            });
    });


    function saveItem(item, res) {
        return new Model(item).save().then(function (row) {
            console.log('post ' + resource + ' id:' + row.get('id'));
            return row;
        }).catch(function (err) {
            console.log('post ' + resource + ' error:', err);
            res.status(500).send(err);
            return false;
        });
    }

    function notifyItemSaved(res, itemSaved) {
        if (itemSaved) {
            res.json(itemSaved);
        }
    }

    router.post('/' + resource, function (req, res) {
        if (options.preSave) {
            options.preSave(req, res, function (item) {
                saveItem(item, res).then(function (itemSaved) {
                    notifyItemSaved(res, itemSaved);

                    if (options.postSave) {
                        if (itemSaved) {
                            options.postSave(req, res, itemSaved);
                        }
                        else {
                            options.postSave(req, res);
                        }
                    }
                });
            });
        } else {
            saveItem(req.body, res).then(function (itemSaved) {
                notifyItemSaved(res, itemSaved);
            });
        }
    });

    function deleteItem(item, res) {
        return new Model(item)
            .fetch({ require: false })
            .then(function (modelItem) {
                if (modelItem) {
                    return modelItem.destroy()
                        .then(function () {
                            console.log('deleteItem ' + resource + ' id:' + item.id);
                            return item;
                        })
                        .catch(function (err) {
                            console.log('deleteItem destroy error:', err);
                            res.status(500).json({ error: true, data: { err } });
                            return false;
                        });
                } else {
                    res.status(404).send('resource to delete not found');
                }
            })
            .catch(function (err) {
                console.log('deleteItem fetch error:', err);
                res.status(500).json({ error: true, data: { err } });
                return false;
            });
    }

    function notifyItemDeleted(res, itemDeleted) {
        if (itemDeleted) {
            res.json(itemDeleted);
        }
    }

    router.delete('/' + resource + "/:id", options.delete || function (req, res) {
        if (options.preDelete) {
            options.preDelete(req, res, function (item) {
                deleteItem(item, res).then(function (itemDeleted) {
                    notifyItemDeleted(res, itemDeleted);

                    if (options.postDelete) {
                        if (itemDeleted) {
                            options.postDelete(req, res, itemDeleted.attributes);
                        }
                        else {
                            options.postDelete(req, res);
                        }
                    }
                });
            });
        } else {
            deleteItem(req.params, res).then(function (itemDeleted) {
                notifyItemDeleted(res, itemDeleted);
            });
        }
    });

    return router;
};
