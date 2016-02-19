"use strict";

var config = require('../../config'),
    _ = require('lodash'),
    Promise = require('knex/lib/promise');

module.exports = function (bookshelf, models) {
    "use strict";
    var user = require('../../user')(bookshelf.knex,models);

    function get(req, res) {
        var segments = req.url.split('/');
        segments.splice(0, 1);
        console.log('Basic_Test:get: op: ' + req.params.op);
        console.log('Basic_Test:get: params: ', req.query);

        var userId = req.user.id;

        if (req.params.op === 'languages') {
            if (req.query.anonymous && req.query.anonymous == 'true') {
                userId = config.ANONIMOUS_USER_ID;
            }
            //get playable languages
            user.getStatistics(userId)
                .then(function (langs) {
                    if (langs) {
                        console.log('Basic_Test:get: languages done:', langs);
                        res.json(langs);
                    }
                    else {
                        res.json(false);
                    }
                });
        }
        else if (req.params.op === 'questions') {
            //get test questions
            //get user translations
            var userQuestions = getQuestions(req.query.fromLang, req.query.toLang, parseInt(req.query.questions) * 5, userId, req.query.difficulty)
                .then(function (userQuestions) {
                    if (!userQuestions) {
                        console.log('Basic_Test:questions: no userQuestions');
                        return;
                    }
                    console.log('Basic_Test:questions: userQuestions: ', userQuestions.rows.length);
                    return userQuestions.rows;
                });

            //get anomymous translations
            var anonymousQuestions = null;
            if (req.query.anonymous && req.query.anonymous == 'true') {
                anonymousQuestions = getQuestions(req.query.fromLang, req.query.toLang, parseInt(req.query.questions) * 5, config.ANONIMOUS_USER_ID, req.query.difficulty)
                    .then(function (anonymousQuestions) {
                        if (!anonymousQuestions) {
                            console.log('Basic_Test:questions: no anonymousQuestions');
                            return;
                        }
                        console.log('Basic_Test:questions: anonymousQuestions: ', anonymousQuestions.rows.length);
                        return anonymousQuestions.rows;
                    });
            }

            //get answers
            var anonymousAnswers = getQuestions(req.query.fromLang, req.query.toLang, req.query.questions * (req.query.answers), -1, req.query.difficulty)
                .then(function (answers) {
                    if (!answers) {
                        console.log('Basic_Test:questions: no anonymousAnswers');
                        return;
                    }
                    console.log('Basic_Test:questions: anonymousAnswers: ', answers.rows.length);
                    return answers.rows;
                });

            Promise.all([userQuestions, anonymousQuestions, anonymousAnswers])
                .then(function (results) {
                    var questions = (results[0].length ? (results[1] ? results[0].concat(results[1]) : results[0]) : results[1]);
                    var answers = results[2];

                    if(!questions || !questions.length || questions.length<15)
                    {
                        return res.status(406).send('not enough answers gotten');
                    }

                    questions.splice(60,100); //leave only 60 translations.
                                    // If low number user translations,
                                    // most of the test questions will be from anonymous translations,
                                    // otherwhise most of them will be from user translations

                    var testData = CreateTest(req.query.questions, req.query.answers, questions, answers);
                    res.json(testData);
                })
                .catch(function(err){
                    console.log('Basic_Test:questions: exception caught: ',err.stack);
                    res.status(500).send('Error happened while getting answers: '+err.message);
                });
        }
    };

    function CreateTest(numQuestions, numAnswers, questionTranslations, questionAnswers) {
        var testData = [];
        console.log('Basic_Test:CreateTest: num questions: '+questionTranslations.length);
        for(var pos=0; testData.length < numQuestions; pos++)
        {
            //select random question from provided translations
            var posQuestion = Math.floor(Math.random() * questionTranslations.length);
            var question = questionTranslations[posQuestion];
            questionTranslations.splice(posQuestion, 1);

            console.log('Basic_Test:CreateTest: processing ('+pos+' - at '+posQuestion+') '+question.translate);
            if(question.translate.split(' ').length > 2) //no phrases
            {
                pos--;
                console.log('Basic_Test:CreateTest: found phrase: '+question.translate);
                continue;
            }

            question.rawResult = JSON.parse(question.rawResult);
            var questionData = {
                translation: question,
                question: question.translate,
                answer: question.mainResult,
                options: []
            };

            var posOk = Math.floor(Math.random() * numAnswers);
            var givenOptions = {};
            for (var i = 0; i < numAnswers;) {
                if (i === posOk) {
                    questionData.options[i] = question.mainResult;
                }
                else {
                    if (questionAnswers.length === 0) break; //no answers left to complete question.options

                    var koPos = Math.floor(Math.random() * questionAnswers.length); //choose one wrong answer
                    var wrongOption = questionAnswers[koPos].mainResult;
                    if (wrongOption.split(' ').length > 2) //no phrases
                    {
                        questionAnswers.splice(koPos, 1);
                        console.log('Basic_Test:CreateTest: found answer phrase: '+wrongOption);
                        continue;
                    }
                    if (wrongOption !== question.mainResult &&    //option is not the correct answer
                        givenOptions[wrongOption] === undefined) //option not already given
                    {
                        givenOptions[wrongOption] = wrongOption;
                        questionData.options[i] = wrongOption;
                        questionAnswers.splice(koPos, 1);
                    }
                    else {
                        continue;
                    }
                }
                i++;
            }

            testData.push(questionData);
        };

        console.log('Basic_Test:CreateTest: done.\n');

        return testData;
    };

    function getQuestions(fromLang, toLang, number, userId, difficulty) {
        if(difficulty){
            var difficulties=difficulty.split('-');
            var sql = 'SELECT * FROM public."Translations" as t ' +
                (userId != -1 ? ' INNER JOIN public."UserTranslations" as ut ON t.id=ut."translationId" WHERE ut."userId"=' + userId + ' AND ' : ' WHERE ')+
                ' t."fromLang"=\'' + fromLang + '\' AND t."toLang"=\'' + toLang + '\' ' +
                ' AND t.difficulty > ' + difficulties[0]+' AND t.difficulty <= ' + difficulties[1] +
                ' ORDER BY random() LIMIT ' + number;
            //console.log('getQuestions: with difficulty: '+difficulty+' -> '+sql);
            return bookshelf.knex.raw(sql);
        }else{
            return bookshelf.knex.raw('SELECT * FROM public."Translations" as t ' +
                (userId != -1 ? ' INNER JOIN public."UserTranslations" as ut ON t.id=ut."translationId" WHERE ut."userId"=' + userId + ' AND ' : ' WHERE ')+
                ' t."fromLang"=\'' + fromLang + '\' AND t."toLang"=\'' + toLang + '\' ORDER BY random() LIMIT ' + number);
            //console.log('getQuestions: without difficulty -> '+sql);
        }
    }

    return {
        get: get
    }
};