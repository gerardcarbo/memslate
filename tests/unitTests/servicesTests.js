/**
 * Created by gerard on 23/04/2015.
 */
"use strict";

describe("Unit: Services Tests", function ()
{
    var httpBackend;

    beforeEach(module('memslate.services'));

    beforeEach(function () {
        module(function ($provide) {
            $provide.constant('TranslationsProvider', 'yandex');
        });
    });

    beforeEach(inject(function (_$httpBackend_) {
        httpBackend = _$httpBackend_;
    }));

    // make sure no expectations were missed in your tests.
    // (e.g. expectGET or expectPOST)
    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });
    
    var objSession1={key1: 'val1', key2: 100};

    describe("SessionService Tests", function () {

        var SessionService;
        beforeEach(inject(function (_SessionService_) {
            SessionService = _SessionService_;
        }));

        it("should be able to put and get values and objects", function () {
            SessionService.put('key1', 'val1')
            expect(SessionService.get('key1')).toBe('val1');
            SessionService.put('key2', 'val2')
            expect(SessionService.get('key2')).toBe('val2');

            SessionService.putObject('keyObj1', objSession1);
            expect(SessionService.getObject('keyObj1')).toEqual(objSession1);
        });

        it("should be able to delete values and objects", function () {
            expect(SessionService.get('key1')).toBe('val1');
            expect(SessionService.get('key2')).toBe('val2');
            expect(SessionService.getObject('keyObj1')).toEqual(objSession1);

            SessionService.remove('key1');
            SessionService.remove('key2');
            SessionService.remove('keyObj1');

            expect(SessionService.get('key1')).toBeNull();
            expect(SessionService.get('key2')).toBeNull();
            expect(SessionService.getObject('keyObj1')).toBeNull();
        });
    });
    
    describe("LanguagesService Tests", function () {
        // set up some data for the http call to return and test later.
        var LanguagesService,SessionService;

        beforeEach(inject(function (_LanguagesService_, _SessionService_) {
            SessionService = _SessionService_;
            LanguagesService = _LanguagesService_;
        }));

        it("LanguagesService and SessionService modules should be registered.", function () {
            expect(LanguagesService).not.toBeNull();
            expect(SessionService).not.toBeNull();
        });

        it("should be able to get User Languages and store it in session variable", function () {
            SessionService.remove('userLanguages');

            // expectGET to make sure this is called once.
            httpBackend.expectGET('resources/userLanguages').respond(testingData.responseUserLanguages);

            var userLangs = {};
            LanguagesService.getUserLanguages().then(
                function (response) {
                    userLangs = response;
                },
                function (err) {
                    console.log('getUserLanguages method' + err);
                    expect(err).toBeNull();
                });

            httpBackend.flush();

            expect(userLangs.userId).toBeDefined();
            expect(userLangs.fromLang).toBeDefined();
            expect(userLangs.toLang).toBeDefined();
            expect(userLangs.prefered).toBeDefined();

            expect(userLangs.userId).toBe(11);
            expect(userLangs.fromLang).toBe('es');
            expect(userLangs.toLang).toBe('en');
            expect(userLangs.prefered.length).toBe(testingData.responseUserLanguages.prefered.length);
            expect(userLangs.prefered[0]).toBe(testingData.responseUserLanguages.prefered[0]);
            expect(userLangs.prefered[1]).toBe(testingData.responseUserLanguages.prefered[1]);
            expect(userLangs.prefered[2]).toBe(testingData.responseUserLanguages.prefered[2]);
            expect(SessionService.getObject('userLanguages')).not.toBeNull();
        });

        it("should be able to get Languages and add Prefered language", function ()
        {
            httpBackend.expectGET('https://translate.yandex.net/api/v1.5/tr.json/getLangs?key=trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430&ui=en')
                .respond(testingData.responseLanguages);
            /*  Not called as localStorage data used...
            httpBackend.expectGET('resources/userLanguages')
                .respond(testingData.responseUserLanguages); */

            var languages = {};
            LanguagesService.getLanguages().then(
                function (response) {
                    languages = response;
                },
                function (err) {
                    console.log('getUserLanguages method' + err);
                    expect(err).toBeNull();
                });

            httpBackend.flush();

            LanguagesService.addPrefered('fr');

            expect(languages.user.fromLang).toBeDefined();
            expect(languages.user.toLang).toBeDefined();
            expect(languages.items).toBeDefined();
            expect(languages.user.prefered).toBeDefined();
            expect(languages.user.fromLang).toBe('es');
            expect(languages.user.toLang).toBe('en');
            expect(languages.items.length).toBeDefined();
            expect(languages.items.length).toBe(46);
            expect(languages.user.prefered.length).toBeDefined();
            expect(languages.user.prefered.length).toBe(4);
            expect(languages.user.prefered[0]).toBe('fr');

            LanguagesService.addPrefered('ru');

            expect(languages.user.prefered.length).toBe(4);
            expect(languages.user.prefered[0]).toBe('ru');
            expect(languages.user.prefered[1]).toBe('fr');
        })
    });

    describe('Translate Service tests', function ()
    {
        var TranslateService;

        beforeEach(inject(function (_TranslateService_) {
            TranslateService = _TranslateService_;
        }));

        it("TranslateService module should be registered.", function () {
            expect(TranslateService).not.toBeNull();
        });

        it("should be able to translate simple word", function ()
        {
            httpBackend.expectGET('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb&lang=en-es&text=cake&ui=en')
                .respond(testingData.responseGetCake);

            httpBackend.expectPOST('resources/translations').respond({id: 0});

            var translationCake = {};
            TranslateService.translate('en', 'es', 'cake').then(
                function (response) {
                    console.log(response)
                    translationCake = response;
                },
                function (err) {
                    console.log('translate method' + err);
                    expect(err).toBeNull();
                });

            httpBackend.flush();

            expect(translationCake.id).toBe(0);
            expect(translationCake.translate).toBe('cake');
            expect(translationCake.mainResult).toBe('pastel');
            expect(translationCake.fromLang).toBe('en');
            expect(translationCake.toLang).toBe('es');
            expect(translationCake.provider).toBe('yd');
            expect(translationCake.rawResult).toBeDefined();
            expect(translationCake.rawResult).toEqual(testingData.responseGetCake);
        });

        it("should be able to translate a phrase (multiple words)", function ()
        {
            httpBackend.expectGET('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=dict.1.1.20140425T100742Z.a6641c6755e8a074.22e10a5caa7ce385cffe8e2104a66ce60400d0bb&lang=en-es&text=do+less&ui=en')
                .respond(testingData.responseGetDoLessDict);

            httpBackend.expectGET('https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20140425T085916Z.05949a2c8c78dfa7.d025a7c757cb09916dca86cb06df4e0686d81430&lang=en-es&text=do+less&ui=en')
                .respond(testingData.responseGetDoLessTransl);

            httpBackend.expectPOST('resources/translations').respond({id: 0});

            var translationDoMore = {};
            TranslateService.translate('en', 'es', 'do less').then(
                function (response) {
                    console.log('translation multiple word');
                    console.log(response);
                    translationDoMore = response;
                },
                function (err) {
                    console.log('translate method' + err);
                    expect(err).toBeNull();
                });

            httpBackend.flush();

            expect(translationDoMore.id).toBe(0);
            expect(translationDoMore.translate).toBe('do less');
            expect(translationDoMore.mainResult).toBe('hacer menos');
            expect(translationDoMore.fromLang).toBe('en');
            expect(translationDoMore.toLang).toBe('es');
            expect(translationDoMore.provider).toBe('yt');
            expect(translationDoMore.rawResult).toBeDefined();
            expect(translationDoMore.rawResult).toEqual(testingData.responseGetDoLessTransl);
        });
    });

    describe('BaseUrl Service tests', function () {
        var BaseUrlService, $rootScope;

        beforeEach(inject(function (_BaseUrlService_, _$rootScope_) {
            BaseUrlService = _BaseUrlService_;
            $rootScope = _$rootScope_;
        }));

        it("Base URL service should return https://memslate.herokuapp.com/.", function (done) {
            expect(BaseUrlService).not.toBeNull();
            httpBackend.expectGET('https://memslate.herokuapp.com/testConnection').respond('Ok');
            httpBackend.expectGET('http://localhost:5000/testConnection').respond(500,'');

            console.log('Trying to connect...');
            BaseUrlService.connect().then(function() {
                console.log(BaseUrlService.get());

                expect(BaseUrlService.get()).toBe('http://localhost:5000/');
                expect(false).toBe(true);

                done();
            });

            done();
        }, 5000);
    });
});
