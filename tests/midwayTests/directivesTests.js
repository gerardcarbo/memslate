/**
 * Created by gerard on 28/04/2015.
 */
"use strict";

describe("Midway: Testing Directives", function()
{
    var tester;
    beforeEach(function () {
        tester = ngMidwayTester('memslate.directives');
    });

    afterEach(function () {
        tester.destroy();
        tester = null;
    });

    describe("Midway: Testing ms-translation Directive", function()
    {
        it("should properly create ms-translation directive for no translation", function (done)
        {
            var html = "<ms-translation translation='translation'></ms-translation>";

            var element = tester.compile(html, null);
            tester.inject('$timeout')(function () {
                expect(element.find('.null_translation_div').length).toBe(1);
                done();
            }, 1000);
        });

        it("should properly create ms-translation directive for translation with error", function (done)
        {
            var TranslateService = tester.inject('TranslateService');

            var html = "<ms-translation translation='translation'></ms-translation>";

            TranslateService.translate('en', 'es', 'fdfrefsr').error(function (error)
            {
                tester.viewScope().translation = {};
                tester.viewScope().translation.error = error;
                var element = tester.compile(html, tester.viewScope());
                tester.inject('$timeout')(function () {
                    console.log(element.scope().translation);
                    expect(element.find('.translation_div').length).toBe(1);
                    expect(element.find('.translation_yd').length).toBe(0);
                    expect(element.find('.translation_samples').length).toBe(0);
                    expect(element.find('.translation_yt').length).toBe(0);
                    expect(element.find('.translating_translation_div').length).toBe(0)
                    expect(element.find('.error_translation_div').length).toBe(1)
                    done();
                }, 1000);
            }).success(function (data) {
                expect(data).toBe(null); // should never reach this point
            });
        });

        it("should properly create ms-translation directive for 1 word translation", function (done)
        {
            var TranslateService = tester.inject('TranslateService');

            var html = "<ms-translation translation='translation'></ms-translation>";

            TranslateService.translate('en', 'es', 'cake').success(function (translation)
            {
                tester.viewScope().translation = translation;
                var element = tester.compile(html, tester.viewScope());
                tester.inject('$timeout')(function () {
                    console.log(element.scope().translation);
                    expect(element.find('.translation_div').length).toBe(1);
                    expect(element.find('.translation_yd').length).toBe(1);
                    expect(element.find('.translation_samples').length).toBe(1);
                    expect(element.find('.translation_yt').length).toBe(0);
                    expect(element.find('.translating_translation_div').length).toBe(0);
                    expect(element.find('.error_translation_div').length).toBe(0);
                    expect(element.find('.translation_yd').html().indexOf('cake')).not.toBe(-1);
                    expect(element.find('.translation_yd').html().indexOf('pastel')).not.toBe(-1);
                    done();
                }, 1000);
            });
        });

        it("should properly create ms-translation directive for multiple word translation", function (done)
        {
            var TranslateService = tester.inject('TranslateService');

            var html = "<ms-translation translation='translation'></ms-translation>";

            TranslateService.translate('en', 'es', 'do less').success(function (translation) {
                tester.viewScope().translation = translation;
                var element = tester.compile(html, tester.viewScope());
                tester.inject('$timeout')(function () {
                    console.log(element.scope().translation);
                    expect(element.find('.translation_div').length).toBe(1);
                    expect(element.find('.translation_yd').length).toBe(0);
                    expect(element.find('.translation_samples').length).toBe(1);
                    expect(element.find('.translation_yt').length).toBe(1);
                    expect(element.find('.translation_yt').html().indexOf('do less')).not.toBe(-1);
                    expect(element.find('.translation_yt').html().indexOf('hacer menos')).not.toBe(-1);
                    done();
                }, 1000);
            });
        });
    });

    describe("Midway: Testing ms-select Directive", function()
    {
        it("should properly create ms-translation directive for no translation", function (done)
        {
            tester.viewScope().items = [{name:'item1',value:'i1'},
                                        {name:'item2',value:'i2'}];

            tester.viewScope().selectedItem = 'i2';

            var html = "<ms-select items='items' name='ItemsTest' selected-item='selectedItem'></ms-select>";

            var element = tester.compile(html, tester.viewScope());
            tester.inject('$timeout')(function () {
                expect(element.html().indexOf('item2')).not.toBe(-1);
                expect(element.html().indexOf('ItemsTest')).not.toBe(-1);
                done();
            }, 1000);
        });
    });
});
