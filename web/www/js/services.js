/**
 * Created by gerard on 18/02/2015.
 */
angular.module('memslate.services', ['ngResource'])

.factory('Translations', function ($resource) {
    return $resource('http://localhost:5000/translations/:translationId');

});