"use strict";
var levenshtein = require('fast-levenshtein');
var Promise = require('bluebird');

module.exports = function (models, log)
{
    var initialized=false;
    var mostUsedWordsCount=0;
    function init()
    {
        if(!initialized) {
            return models.MostUsedWords.count().then(function(count){
                mostUsedWordsCount = count;
                initialized = true;
            });
        } else {
           return new Promise.resolve(true);
        }
    }

    function normalizedLevenshteinDistance(word1, word2)
    {
        var distance = levenshtein.get(word1.toLowerCase(), word2.toLowerCase());
        var maxlen = (word1.length > word2.length ? word1.length : word2.length);
        var normalized = distance/maxlen;
        normalized = normalized*normalized;
        if (log) console.log('difficulty: levenshteinDistance: '+distance+' of '+maxlen+' -> '+normalized);
        return normalized;
    }

    function wordUsageDistance(word)
    {
        return models.MostUsedWords.forge({word:word}).fetch().then(function(wordUsage){
            if(!wordUsage)
            {
                if(log) console.log('difficulty: wordUsageDistance: '+word+' not found -> 1');
                return 1; //undefined
            }
            else
            {
                var position = wordUsage.get('position');
                var norm = position/mostUsedWordsCount;
                if(log) console.log('difficulty: wordUsageDistance: postion '+position+' of '+count+' -> '+norm);
                return norm;
            }
        });
    }

    function difficulty(englishWord, otherLangWord)
    {
        return init().then(function(){
            var ld=normalizedLevenshteinDistance(englishWord,otherLangWord);
            return wordUsageDistance(englishWord).then(function(wud){
                return Math.sqrt(ld*wud);
            });
        });
    }

    return {
        compute: difficulty //returns a value between 0 and 1
    };
};
