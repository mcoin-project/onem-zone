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
    'dndLists'
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
        when('/builder', {
            templateUrl: 'views/partials/builder.html',
            controller: 'buildController',
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

ONEmSimModule.factory('HelpData', function() {
    var data = {
        sections: [
            { name: "1 Introduction", level: '1', fileName: "1_0_Introduction" },
            { name: "1.1 Getting Started", level: '2', fileName: "1_1_GettingStarted" },
            { name: "1.2 First Time Access", level: '2', fileName: "1_2_FirstTimeAccess" },
            { name: "1.3 Menus", level: '2', fileName: "1_3_Menus" },
            { name: "1.4 Variables", level: '2', fileName: "1_4_Variables" },
            { name: "2 JSON Reference", level: '1', fileName: "2_0_Reference" },
            { name: "2.1 Input", level: '2', fileName: "2_1_Input" },
            { name: "2.2 Menu", level: '2', fileName: "2_2_Menu" }
        ],
        currentIndex: 0
    };

    return {
        data: data,
        getSections: function() {
            return data.sections;
        },
        selectSection: function(index) {
            data.currentIndex = index;
            console.log("currentIndex: " + data.currentIndex);
            var fileName = '/views/partials/helpContent/' + data.sections[data.currentIndex].fileName + ".html";
            return fileName;
        },
        getFileName: function() {
            var fileName = '/views/partials/helpContent/' + data.sections[data.currentIndex].fileName + ".html";
            return fileName;
        }
    };
});

ONEmSimModule.factory('DataModel', function() {
    var data = {
        tabs: [
            { name: "Files", isActive: true, refId: "#file-manager-tab" },
            { name: "Log", isActive: false, refId: "#log-tab" },
            { name: "Develop", isActive: false, refId: "#develop-tab" },
            { name: "Help", isActive: false, refId: "#help-tab" }
        ],
        results: [],
        logs: [],
        comments: []
    };

    return {
        data: data,
        clearComments: function() {
            data.comments = [];
            return data.comments;
        },
        getTabs: function() {
            return data.tabs;
        },
        getResults: function() {
            return data.results;
        },
        getComments: function() {
            return data.comments;
        },
        getLogs: function() {
            return data.logs;
        },
        selectTab: function(tab) {
            for (var i = 0; i < data.tabs.length; i++) {
                if (tab.refId === data.tabs[i].refId) {
                    data.tabs[i].isActive = true;
                } else {
                    data.tabs[i].isActive = false;
                }
            }
            return data.tabs;
        },
        addResult: function(result) {
            data.results.push(result);
            return data.results;
        },
        addComment: function(comment) {
            data.comments.push(comment);
            return data.comments;
        },
        addLog: function(log) {
            data.logs.push(log);
            return data.logs;
        },
        clearLogs: function() {
            data.logs = [];
            return data.logs;
        }
    };
});

ONEmSimModule.controller('tabController', [
    '$scope',
    'DataModel',
    'HelpData',
    function($scope, DataModel, HelpData) {

        $scope.tabs = DataModel.getTabs();
        $scope.helpContentPage = HelpData.getFileName();

        $scope.selectTab = function(tab) {
            $scope.tabs = DataModel.selectTab(tab);
        };

        $scope.sections = HelpData.getSections();
        $scope.currentSection = 0;

        $scope.selectSection = function(index) {
            console.log("section: " + index);
            $scope.helpContentPage = HelpData.selectSection(index);
        };
    }
]);

ONEmSimModule.controller('buildController', [
    '$scope',
    '$http',
    function($scope, $http) {
        $scope.models = {
            selected: null,
            templates: [
                { type: "item", id: 2 },
                { type: "menu", id: 1, columns: [
                        []
                    ] }
            ],
            dropzones: {
                "#account": [{
                    "type": "menu",
                    "id": 1,
                    "columns": [
                        [{
                            "type": "item",
                            "id": "1"
                        }, {
                            "type": "item",
                            "id": "2"
                        }]
                    ]
                }, {
                    "type": "item",
                    "id": "4"
                }, {
                    "type": "item",
                    "id": "5"
                }, {
                    "type": "item",
                    "id": "6"
                }, {
                    "type": "item",
                    "id": 16
                }]
            }
        };

        $scope.$watch('models.dropzones', function(model) {
            $scope.modelAsJson = angular.toJson(model, true);
        }, true);
    }
]);

ONEmSimModule.controller('mainController', [
    '$scope',
    '$http',
    'toastr',
    'SmsHandler',
    'DataModel',
    function($scope, $http, toastr, SmsHandler, DataModel) {

        console.log("mainController initialising");

        $scope.comments = DataModel.getComments();
        $scope.results = DataModel.getResults();
        $scope.logs = DataModel.getLogs();
        $scope.responsesCount = 0;

        $scope.resetComments = function() {
            $scope.comments = DataModel.clearComments;
        };

        $scope.resetlogs = function() {
            $scope.logs = DataModel.clearLogs;
        };

        $scope.smsInput = function() {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results = DataModel.addResult(inputObj);

            var response = SmsHandler.getResponse({ moText: $scope.smsText }, function() {

                if (typeof response.mtText === 'undefined' || response.mtText.length === 0) return;

                var outputObj = {
                    type: "mt",
                    value: response.mtText
                };

                $scope.results = DataModel.addResult(outputObj);

                if (typeof response.comment !== 'undefined') {
                    $scope.comments = DataModel.addComment(response.comment);
                    console.log("comments.length:" + $scope.comments.length);
                }

                console.log("response.log:" + response.log);

                if (typeof response.log !== 'undefined') {
                    $scope.logs = DataModel.addLog(response.log);
                    console.log("logs.length:" + $scope.logs.length);
                }

                // simulate an unsocilicted MT message and call another Get request
                if (response.skip) {
                    console.log("skipping");
                    var result = SmsHandler.getResponse({ skip: true }, function() {
                        var outputObj = {
                            type: "mt",
                            value: result.mtText
                        };

                        DataModel.addResult(outputObj);
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