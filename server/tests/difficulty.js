"use strict";
console.log('* Compute Difficulty *');

var config      = require('../config');
var knex        = require('knex')(config.knex_options);
var bookshelf   = require('bookshelf')(knex);
var models      = require('../models')(bookshelf);
var difficulty = require('../difficulty')(models, true);

function normalizedLevenshteinDistance(word1, word2)
{
    var distance = levenshtein.get(word1, word2);
    var maxlen = (word1.length > word2.length ? word1.length : word2.length);

    return distance/maxlen;
}

function wordUsageDistance(word)
{
    return models.MostUsedWords.forge({word:word}).fetch({ require: false }).then(function(wordUsage){
        if(!wordUsage)
        {
            return 1;
        }
        else
        {
            var position = wordUsage.get('position');
            console.log('wordUsageDistanceBBB: postion '+position);
            return position/20000;
        }
    })
}

function difficulty2(englishWord, otherLangWord)
{
    var ld=normalizedLevenshteinDistance(englishWord,otherLangWord);
    return wordUsageDistance(englishWord).then(function(wud){
        return Math.ceil((ld*wud)*100);
    })
}

var word1="consensus";
var word2="consenso";

/*var dist = normalizedLevenshteinDistance(word1,word2);

console.log('Le Distance: '+dist);

wordUsageDistance(word1).then(function(wud){
    console.log('WU Distance: '+wud);
});

difficulty2(word1,word2).then(function(d){
    console.log('Difficulty2: '+d);
});*/
console.log('From: '+word1+' to '+word2);
difficulty.compute(word1,word2).then(function(d){
    console.log('Difficulty: '+d);
});