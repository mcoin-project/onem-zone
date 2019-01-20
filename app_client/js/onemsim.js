'use strict';

const GOOGLE_CLIENT_ID = '785326362402-co8gkpjf1rcfmiur67pggp4mkersm4mi.apps.googleusercontent.com';
const FACEBOOK_CLIENT_ID = '280049366235647';

var ONEmSimModule = angular.module('ONEmSimModule', [
    'ngResource',
    'matchMedia',
    'btford.socket-io',
    'ngSanitize',
    'toastr',
    'satellizer',
    'ui.router',
    'ngIntlTelInput',
    'mp.autoFocus',
    'monospaced.elastic'
]).filter('nl2br', ['$sanitize', function ($sanitize) {
    var tag = (/xhtml/i).test(document.doctype) ? '<br />' : '<br>';
    return function (msg) {
        // ngSanitize's linky filter changes \r and \n to &#10; and &#13; respectively
        msg = (msg + '').replace(/(\r\n|\n\r|\r|\n|&#10;&#13;|&#13;&#10;|&#10;|&#13;)/g, tag + '$1');
        return $sanitize(msg);
    };
}]).run(['$state', '$stateParams', function($state, $stateParams) {
        //this solves page refresh and getting back to state
}]);

ONEmSimModule.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$authProvider', 'ngIntlTelInputProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider, $authProvider, ngIntlTelInputProvider) {

        ngIntlTelInputProvider.set({
            initialCountry: 'gb',
            utilsScript: 'bower_components/intl-tel-input/build/js/utils.js'
        });

        /**
       * Helper auth functions
       */
        var landingRedirect = ['$q', '$location', '$auth', function ($q, $location, $auth) {
            var deferred = $q.defer();
            console.log("landingRedirect:" + $auth.isAuthenticated());

            if ($auth.isAuthenticated()) {
                $location.path('/home');
            } else {
                $location.path('/login');
            }
            return deferred.promise;
        }];
        
        var skipIfLoggedIn = ['$q', '$location', '$auth', function ($q, $location, $auth) {
            var deferred = $q.defer();
            console.log("skipIfLoggedIn:" + $auth.isAuthenticated());

            if ($auth.isAuthenticated()) {
                $location.path('/');
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }];

        var loginRequired = ['$q', '$location', '$auth', function ($q, $location, $auth) {
            console.log("loginRequired:" + $auth.isAuthenticated());

            var deferred = $q.defer();
            if ($auth.isAuthenticated()) {
                deferred.resolve();
            } else {
                $location.path('/login');
            }
            return deferred.promise;
        }];

        const redirectUri = window.location.origin + '/auth-endpoint';
        /**
        *  Satellizer config
        */
        $authProvider.baseUrl = '/api';
        $authProvider.google({
            clientId: GOOGLE_CLIENT_ID,
            redirectUri: redirectUri
        });

        $authProvider.facebook({
            clientId: FACEBOOK_CLIENT_ID,
            redirectUri: redirectUri
          });

        console.log("auth header:");
        console.log($authProvider.tokenHeader);
        console.log($authProvider.tokenType);

        $stateProvider.
            state('landing', {
                url: '/',
                templateUrl: 'partials/login.html',
                controller: 'loginController',
                resolve: {
                    landingRedirect: landingRedirect
                }
            }).
            state('authEndpoint', {
                url: '/auth-endpoint'
            }).
            state('home', {
                url: '/home',
                templateUrl: 'partials/onemSim.html',
                controller: 'mainController',
                resolve: {
                    loginRequired: loginRequired
                }
            }).
            state('login', {
                url: '/login',
                templateUrl: 'partials/login.html',
                controller: 'loginController',
                resolve: {
                    skipIfLoggedIn: skipIfLoggedIn
                }
            }).
            state('captureMsisdn', {
                url: '/login',
                templateUrl: 'partials/msisdn.html',
                controller: 'captureMsisdnController',
                resolve: {
                    loginRequired: loginRequired
                }
            }).
            state('captureToken', {
                url: '/login',
                templateUrl: 'partials/token.html',
                controller: 'captureTokenController',
                resolve: {
                    loginRequired: loginRequired
                }
            }).
            state('logoutDelete', {
                url: '/logoutDelete',
                templateUrl: null,
                controller: 'logoutDeleteController'
            }).
            state('logout', {
                url: '/logout',
                templateUrl: null,
                controller: 'logoutController'
            });

        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);

    }
]);

ONEmSimModule.config(['$httpProvider',
    function ($httpProvider) {
        $httpProvider.interceptors.push([
            '$q',
            '$window',
            '$location',
            function ($q, $window, $location) {

                return {
                    request: function (config) {
                        if ($window.localStorage.token) {

                        }
                        return config;
                    },
                    responseError: function (response) {
                        switch (response.status) {
                            case 400:
                            case 403:
                            case 404:
                                console.log("404");
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


     