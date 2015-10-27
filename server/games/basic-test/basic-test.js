var config = require('../../config');

module.exports = function (bookshelf, models) {
    "use strict";

    function get(req, res) {
        var segments = req.url.split('/');
        segments.splice(0, 1);
        console.log('Basic_Test:get: op: ' + req.params.op)
        console.log('Basic_Test:get: params: ', req.query)

        var userId = req.user.id;
        if (req.query.anonymous && req.query.anonymous == 'true') {
            userId = config.ANONIMOUS_USER_ID;
        }

        if (req.params.op === 'languages') {
            //get playable languages
            bookshelf.knex.raw('SELECT t."fromLang", t."toLang", count(*) as count FROM public."Translations" as t ' +
                'INNER JOIN public."UserTranslations" as ut ON t.id=ut."translationId" ' +
                'WHERE ut."userId"=' + userId + ' GROUP BY t."fromLang", t."toLang" ' +
                'ORDER BY t."fromLang" ASC, t."toLang" ASC').
                then(function (langs) {
                    if (langs) {
                        console.log('Basic_Test:get: languages done:', langs.rows);
                        res.json(langs.rows);
                    }
                    else {
                        res.json(false);
                    }
                }, function (err) {
                    console.log('Basic_Test:get: languages error:', err);
                    res.status(500).send('failed to get languages');
                });
        }
        else if (req.params.op === 'questions') {
            return getQuestions(req, req.query.fromLang, req.query.toLang, parseInt(req.query.questions)*1.5, userId)
                .then(function (questions) {
                    console.log('Basic_Test:questions: gotten: ', questions.rows.length);
                    if (!questions.rows || !questions.rows.length) {
                        res.status(500).send('no questions gotten');
                        return;
                    }

                    var questionTranslations = questions.rows;
                    getQuestions(req, req.query.fromLang, req.query.toLang, req.query.questions * (req.query.answers), userId)
                        .then(function (answers) {
                            console.log('Basic_Test:questions: questionAnswers: ', answers.rows.length);
                            if (!answers.rows || !answers.rows.length) {
                                res.status(500).send('no answers gotten');
                                return;
                            }

                            var questionAnswers = answers.rows;
                            var guestionsData = [];

                            for(var pos=0; guestionsData.length < req.query.questions && pos < questionTranslations.length; pos++)
                            {
                                var question = questionTranslations[pos];
                                console.log('Basic_Test:questions: procesing '+question.translate+' ('+pos+')');
                                if(question.translate.split(' ').length > 2) //no phrases
                                {
                                    console.log('Basic_Test:questions: found phrase: '+question.translate);
                                    continue;
                                }

                                var questionData = {
                                    question: question.translate,
                                    answer: question.mainResult,
                                    options: []
                                };

                                var posOk = Math.floor(Math.random() * req.query.answers);
                                var givenOptions = {};
                                for (var i = 0; i < req.query.answers;) {
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
                                            console.log('Basic_Test:questions: found answer phrase: '+wrongOption);
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

                                guestionsData.push(questionData);
                            };

                            console.log('Basic_Test:get: questions done:\n', guestionsData);

                            res.json(guestionsData);
                        }, function (err) {
                            console.log('Basic_Test:get Questions 2: error:', err);
                            res.status(500).send('failed to get Questions');
                        });

                }, function (err) {
                    console.log('Basic_Test:get Questions: error:', err);
                    res.status(500).send('failed to get Questions');
                });
        }
    };

    function getQuestions(req, fromLang, toLang, number, userId) {
        return bookshelf.knex.raw('SELECT * FROM public."Translations" as t INNER JOIN public."UserTranslations" as ut ON t.id=ut."translationId" WHERE ut."userId"=' + userId +
            ' AND t."fromLang"=\'' + fromLang + '\' AND t."toLang"=\'' + toLang + '\' ORDER BY random() LIMIT ' + number);
    }

    return {
        get: get
    }
};