/**
 * Created by gerard on 18/02/2015.
 */
angular.module('starter.services', ['ngResource'])

.factory('Session', function ($resource) {
    return $resource('http://localhost:5000/sessions/:sessionId');
});