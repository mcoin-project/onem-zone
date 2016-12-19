'use strict';

var ONEmSimModule = angular.module('ONEmSimModule', [
    'ui.bootstrap',
    'ngRoute',
    'ngResource',
    'ngMessages',
    'ngAnimate',
    'toastr',
    'angularMoment',
    'matchMedia',
]).run(function() {
    moment.locale('en', {
        relativeTime: {
            future: "in %s",
            past: "%s",
            s: "just now",
            m: "1m",
            mm: "%dm",
            h: "1h",
            hh: "%dh",
            d: "1d",
            dd: "%dd",
            M: "1m",
            MM: "%dm",
            y: "1y",
            yy: "%dy"
        }
    });
});

ONEmSimModule.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

        $routeProvider.
        when('/', {
            templateUrl: 'views/partials/onemSim.html',
            controller: 'mainController',
        }).
        when('/home', {
            templateUrl: 'views/partials/onemSim.html',
            controller: 'mainController',
        }).
        otherwise({
            redirectTo: '/'
        });

        $locationProvider.html5Mode(true);

        String.prototype.startsWith = function(needle) {
            return (this.indexOf(needle) === 0);
        };
    }
]);

ONEmSimModule.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.interceptors.push([
            '$rootScope',
            '$q',
            '$window',
            '$location',
            function($rootScope, $q, $window, $location) {
                return {
                    request: function(config) {
                        if ($window.localStorage.token) {

                        }
                        return config;
                    },
                    responseError: function(response) {
                        switch (response.status) {
                            case 400:
                            case 401:
                            case 403:
                            case 404:
                                $location.path('/');
                                break;
                            default:
                                break;
                        }
                        return $q.reject(response);
                    }
                };
            }
        ]);
    }
]);

ONEmSimModule.controller('mainController', [
    '$scope',
    '$http',
    'toastr',
    function($scope, $http, toastr) {

        $scope.results = [];
        $scope.responsesCount = 0;

        $scope.smsInput = function() {
            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results.push(inputObj);
            $scope.smsText = '';

            $scope.responsesCount++;
            var response = "response " + $scope.responsesCount;

            var outputObj = {
                type: "mt",
                value: response
            };

            $scope.results.push(outputObj);
        };

    }
]);