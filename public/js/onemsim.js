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
    'ngFileUpload',
    'FileManagerApp',
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

ONEmSimModule.controller('tabController', [
    '$rootScope',
    function($rootScope) {
        console.log("initialising");

        $rootScope.selectTab = function(tab) {
            for (var i = 0; i < $rootScope.onemtabs.length; i++) {
                $rootScope.onemtabs[i].isActive = false;
            }
            tab.isActive = true;
            console.log("tabs:");
            console.log($rootScope.onemtabs);
        };
    }
]);

ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$http',
    'toastr',
    'SmsHandler',
    function($scope, $rootScope, $http, toastr, SmsHandler) {

        $scope.results = [];
        $scope.comments = [];
        $scope.responsesCount = 0;

        $scope.resetComments = function() {
            $scope.comments = [];
        };

        if (typeof $rootScope.onemtabs === 'undefined') {
            $rootScope.onemtabs = [
                { name: "Files", isActive: true, refId: "#file-manager-tab" },
                { name: "Log", isActive: false, refId: "#log-tab" },
                { name: "Help", isActive: false, refId: "#help-tab" }
            ];
        }


        $scope.smsInput = function() {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results.push(inputObj);

            var response = SmsHandler.getResponse({ moText: $scope.smsText }, function() {

                if (typeof response.mtText === 'undefined' || response.mtText.length === 0) return;

                var outputObj = {
                    type: "mt",
                    value: response.mtText
                };

                $scope.results.push(outputObj);

                if (typeof response.comment !== 'undefined') {
                    $scope.comments.push(response.comment);
                    console.log("comments.length:" + $scope.comments.length);
                }

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

ONEmSimModule.config(['fileManagerConfigProvider',
    function(config) {
        var defaults = config.$get();
        debugger;
        config.set({
            listUrl: '/files/list',
            getContentUrl: '/files/getContent',
            uploadUrl: '/files/upload',
            removeUrl: '/files/remove',
            createFolderUrl: '/files/createFolder',
            downloadFileUrl: '/files/download',
            downloadMultipleUrl: '/files/downloadMultiple',
            downloadAllUrl: '/files/downloadAll',
            renameUrl: '/files/rename',
            editUrl: '/files/edit',
            copyUrl: '/files/copy',
            appName: 'ONEmSim',
            sidebar: true,
            searchForm: false,
            hidePermissions: true,
            hideDate: true,
            hideSize: true,
            tplPath: 'tpl/templates',
            showSizeForDirectories: false,
            // pickCallback: function(item) {
            //     var msg = 'Picked %s "%s" for external use'
            //         .replace('%s', item.type)
            //         .replace('%s', item.fullPath());
            //     window.alert(msg);
            // },

            allowedActions: angular.extend(defaults.allowedActions, {
                pickFiles: true,
                changePermissions: false,
                upload: true,
                downloadAll: true,
                copy: true,
                move: false,
                pickFolders: false,
                compress: false
            }),
        });
    }
]);