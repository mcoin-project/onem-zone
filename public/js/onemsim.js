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

ONEmSimModule.factory('SmsHandler', [
    '$resource',
    function($resource) {
        return $resource('/api', {}, {
            getResponse: {
                method: 'GET',
                params: {},
                url: 'api/getResponse',
                params: {
                    moText: '@moText'
                },
                isArray: false
            }
        });
    }
]);

ONEmSimModule.directive('scrollBottom', function() {
    return {
        scope: {
            scrollBottom: "="
        },
        link: function(scope, element) {
            scope.$watchCollection('scrollBottom', function(newValue) {
                if (newValue) {
                    //      $(element).scrollTop($(element)[0].scrollHeight);

                    var scrollHeight = $(element)[0].scrollHeight;
                    $(element).animate({ scrollTop: scrollHeight }, 300);
                }
            });
        }
    };
});

ONEmSimModule.controller('mainController', [
    '$scope',
    '$http',
    'toastr',
    'SmsHandler',
    function($scope, $http, toastr, SmsHandler) {

        $scope.results = [];
        $scope.responsesCount = 0;

        $scope.smsInput = function() {
            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results.push(inputObj);

            var response = SmsHandler.getResponse({ moText: $scope.smsText }, function() {
                var outputObj = {
                    type: "mt",
                    value: response.mtText
                };

                $scope.results.push(outputObj);

                // simulate an unsocilicted MT message and call another Get request
                if (response.skip) {
                    console.log("skipping");
                    var result = SmsHandler.getResponse({ skip: true }, function() {
                        var outputObj = {
                             type: "mt",
                             value: result.mtText
                        };

                        $scope.results.push(outputObj);
                    });
                }

            });
            $scope.smsText = '';
        };
    }
]);