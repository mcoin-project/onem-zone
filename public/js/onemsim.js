'use strict';

var ONEmSimModule = angular.module('ONEmSimModule', [
    'ui.bootstrap',
    'ngRoute',
    'ngResource',
    'matchMedia',
    'btford.socket-io'
]);

ONEmSimModule.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

        $routeProvider.
        when('/', {
            templateUrl: 'views/partials/onemSim.html',
            controller: 'mainController'
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

ONEmSimModule.factory('Socket', function(socketFactory) {
    var mySocket = socketFactory();
    mySocket.forward('error');
    mySocket.forward('MT SMS');
    return mySocket;
});

ONEmSimModule.factory('UserInterface', function() {
    $('a.open_dialer').click(function(e) {
        e.preventDefault();
        $(this).parents('.phone').find('div.dialer').toggleClass('open');
        console.log('[UI]: Dialer opened!');
        return false;
    });
    return false;
});

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
            },
            start: {
                method: 'GET',
                url: 'api/start',
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

ONEmSimModule.controller('mainController', [
    '$scope',
    '$http',
    'SmsHandler',
    'DataModel',
    'Socket',
    'UserInterface',
    function($scope, $http, SmsHandler, DataModel, Socket, UserInterface) {

        console.log("mainController initialising");

        //These are the buttons of the phone's user interface:
        var AnswerButton = $('.call_tools a.answer');
        var RejectButton = $('.call_tools a.cancel');
        var CallButton = $('');
        var ClosePanelButton = $('');

        var audioElement = document.getElementById('myAudio');

        var rtp_session = null;
        var isInCall = 0;
        var isIncomingCall = 0;
        var globalSession = null;

        var socket = new JsSIP.WebSocketInterface('ws://zoiper.dhq.onem');

        // Register callbacks to desired call events
        var eventHandlers = {
            'progress'  : function(e) {
                console.log('eventHandlers - progress');
            },
            'failed'    : function(e) {
                console.log('eventHandlers - failed');
                audioElement.pause();
            },
            'ended'     : function(e) {
                console.log('eventHandlers - ended');
                audioElement.pause();
            },
            'confirmed' : function(e) {
                console.log('eventHandlers - confirmed');
                ////audioElement is <audio> element on page
                ////audioElement.src = window.URL.createObjectURL(stream);
                //audioElement.src = window.URL.createObjectURL(rtp_session.connection.getRemoteStreams()[0]);
                //audioElement.play();
                //isInCall = 1;
            },
            'addstream' : function(e) {
                console.log('eventHandlers - addstream');
            }
        };

        var options = {
            'eventHandlers'        : eventHandlers,
            'sessionTimersExpires' : 600,
            'mediaConstraints'     : { 'audio' : true, 'video' : false } //,
        };

        var startResponse = SmsHandler.start({}, function() {
            $scope.msisdn = startResponse.msisdn;
            console.log("msisdn:" + $scope.msisdn);

            //JsSIP configuration:
            var configuration = {
                'sockets'  : [ socket ],
                'uri'      : 'sip:' + $scope.msisdn + '@zoiper.dhq.onem',
                'password' : 'ONEmP@$$w0rd2016'
            };

            var ua = new JsSIP.UA(configuration);

            ua.on('newRTCSession', function(data){
                console.log('newRTCSession');
                globalSession = data.session; //session pointer

                isIncomingCall = 1;
                $('.phone div.caller').toggleClass('open');

                //Play ring tone:
                audioElement.src = "/sounds/old_british_phone.wav";
                audioElement.play();

                if(globalSession.direction === "incoming"){
                    //incoming call here:
                    globalSession.on("accepted",function(){
                        console.log('newRTCSession - incoming - accepted');
                        audioElement.src = window.URL.createObjectURL(globalSession.connection.getRemoteStreams()[0]);
                        audioElement.play();
                        isInCall = 1;
                    });
                    globalSession.on("ended",function(e){
                        console.log('newRTCSession - incoming - ended');
                        audioElement.pause();
                        $('.phone div.panel').removeClass('open');
                    });
                    globalSession.on("failed",function(e){
                        console.log('newRTCSession - incoming - failed');
                        audioElement.pause();
                    });

                    //// End call in 30 seconds:
                    //setTimeout(IncomingEndCall, 30000);
                };
            });

            ua.start();

            // For debug run this in the browser's console and reload the page:
            // JsSIP.debug.enable('JsSIP:*');

            // Answer the call:
            AnswerButton.click( function(){
                console.log('AnswerButton - click');
                globalSession.answer(options);
                $('.phone div.panel').removeClass('open');
                $('.phone div.answer').toggleClass('open');
            });

            // End the call or reject the call:
            RejectButton.click( function(){
                console.log('RejectButton - click');
                globalSession.terminate();
                $('.phone div.panel').removeClass('open');
            });

            //function IncomingEndCall() {
            //  globalSession.terminate();
            //};

        });

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

        $scope.$on('error', function(ev, data) {
            console.log("socket error:" + ev);
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:MT SMS', function(ev, data) {
            $scope.theData = data;

            console.log("MT received:");
            console.log(data);

            var outputObj = {
                type: "mt",
                value: data.mtText
            };

            $scope.results = DataModel.addResult(outputObj);

        });

        $scope.smsInput = function() {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results = DataModel.addResult(inputObj);

            console.log("calling emit");

            Socket.emit('MO SMS', $scope.smsText);

            $scope.smsText = '';
        };
    }
]);

