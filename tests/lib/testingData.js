/**
 * Created by gerard on 28/04/2015.
 */
var testingData = {};

testingData.responseLanguages = {
    "dirs": ["az-ru", "be-bg", "be-cs", "be-de", "be-en", "be-es", "be-fr", "be-it", "be-pl", "be-ro", "be-ru", "be-sr", "be-tr", "bg-be", "bg-ru", "bg-uk", "ca-en", "ca-ru", "cs-be", "cs-en", "cs-ru", "cs-uk", "da-en", "da-ru", "de-be", "de-en", "de-es", "de-fr", "de-it", "de-ru", "de-tr", "de-uk", "el-en", "el-ru", "en-be", "en-ca", "en-cs", "en-da", "en-de", "en-el", "en-es", "en-et", "en-fi", "en-fr", "en-hu", "en-it", "en-lt", "en-lv", "en-mk", "en-nl", "en-no", "en-pt", "en-ru", "en-sk", "en-sl", "en-sq", "en-sv", "en-tr", "en-uk", "es-be", "es-de", "es-en", "es-ru", "es-uk", "et-en", "et-ru", "fi-en", "fi-ru", "fr-be", "fr-de", "fr-en", "fr-ru", "fr-uk", "hr-ru", "hu-en", "hu-ru", "hy-ru", "it-be", "it-de", "it-en", "it-ru", "it-uk", "lt-en", "lt-ru", "lv-en", "lv-ru", "mk-en", "mk-ru", "nl-en", "nl-ru", "no-en", "no-ru", "pl-be", "pl-ru", "pl-uk", "pt-en", "pt-ru", "ro-be", "ro-ru", "ro-uk", "ru-az", "ru-be", "ru-bg", "ru-ca", "ru-cs", "ru-da", "ru-de", "ru-el", "ru-en", "ru-es", "ru-et", "ru-fi", "ru-fr", "ru-hr", "ru-hu", "ru-hy", "ru-it", "ru-lt", "ru-lv", "ru-mk", "ru-nl", "ru-no", "ru-pl", "ru-pt", "ru-ro", "ru-sk", "ru-sl", "ru-sq", "ru-sr", "ru-sv", "ru-tr", "ru-uk", "sk-en", "sk-ru", "sl-en", "sl-ru", "sq-en", "sq-ru", "sr-be", "sr-ru", "sr-uk", "sv-en", "sv-ru", "tr-be", "tr-de", "tr-en", "tr-ru", "tr-uk", "uk-bg", "uk-cs", "uk-de", "uk-en", "uk-es", "uk-fr", "uk-it", "uk-pl", "uk-ro", "uk-ru", "uk-sr", "uk-tr"],
    "langs": {
        "ar": "Arabic",
        "az": "Azerbaijani",
        "be": "Belarusian",
        "bg": "Bulgarian",
        "bs": "Bosnian",
        "ca": "Catalan",
        "cs": "Czech",
        "da": "Danish",
        "de": "German",
        "el": "Greek",
        "en": "English",
        "es": "Spanish",
        "et": "Estonian",
        "fi": "Finnish",
        "fr": "French",
        "he": "Hebrew",
        "hr": "Croatian",
        "hu": "Hungarian",
        "hy": "Armenian",
        "id": "Indonesian",
        "is": "Icelandic",
        "it": "Italian",
        "ja": "Japanese",
        "ka": "Georgian",
        "ko": "Korean",
        "lt": "Lithuanian",
        "lv": "Latvian",
        "mk": "Macedonian",
        "ms": "Malay",
        "mt": "Maltese",
        "nl": "Dutch",
        "no": "Norwegian",
        "pl": "Polish",
        "pt": "Portuguese",
        "ro": "Romanian",
        "ru": "Russian",
        "sk": "Slovak",
        "sl": "Slovenian",
        "sq": "Albanian",
        "sr": "Serbian",
        "sv": "Swedish",
        "th": "Thai",
        "tr": "Turkish",
        "uk": "Ukrainian",
        "vi": "Vietnamese",
        "zh": "Chinese"
    }
};

testingData.responseUserLanguages = {
    userId: 11,
    fromLang: 'es',
    toLang: 'en',
    prefered: ['es', 'en', 'ca']
};

testingData.responseGetCake = {
    "head": {},
    "def": [{
        "text": "cake",
        "pos": "noun",
        "ts": "ke?k",
        "tr": [{
            "text": "pastel",
            "pos": "noun",
            "gen": "m",
            "syn": [{"text": "torta", "pos": "noun", "gen": "f"}, {
                "text": "tarta",
                "pos": "noun",
                "gen": "f"
            }, {"text": "Cake", "pos": "noun", "gen": "m"}],
            "mean": [{"text": "pastry"}, {"text": "tart"}]
        }]
    }]
};
testingData.responseGetDoLessDict = {"head": {}, "def": []};
testingData.responseGetDoLessTransl = {"code": 200, "lang": "en-es", "text": ["hacer menos"]};