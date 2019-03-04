ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'Cache',
    'SmsHandler',
    'User',
    'Phone',
    '$timeout',
    'Cache',
    'toastr',
    function ($scope, $rootScope, $state, Cache, SmsHandler, User, Phone, $timeout, Cache, toastr) {
        console.log("user:" + $rootScope.user);
        
        var phoneONEm;

        function resolveState() {

            console.log("$scope.$parent.touchCheckboxModel.on");
            console.log($scope.$parent.touchCheckboxModel.on);
            console.log("resolving state:" + $scope.$parent.touchCheckboxModel.on)
            $scope.$parent.ready = true;
            if ($scope.$parent.touchCheckboxModel.on) {
                $state.go('service', { initialize: true, service: Cache.getLandingService() });
            } else {
                $state.go('console');
            }
        }
        $scope.$parent.touchCheckboxModel = {};
        $scope.$parent.emailCheckboxModel = {};

        User.getProfile().$promise.then(function (response) {
            $scope.$parent.touchCheckboxModel = {
                on: response.user.touchMode
            };
            $scope.$parent.emailCheckboxModel = {
                on: !response.user.dontSendEmails
            };
            console.log("$scope.emailCheckboxModel.on");
            console.log($scope.$parent.emailCheckboxModel.on);
            if (Cache.isInitialized()) {
                console.log("already initialized");
                throw null;
            } else if (!$rootScope.msisdn) {
                return User.getMsisdn().$promise;
            } else {
                return { msisdn: $rootScope.msisdn };
            }
        }).then(function (response) {
            console.log("setting msisdn:" + response.msisdn);
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $rootScope.msisdn = response.msisdn;
                $rootScope.user = response.user;
                $rootScope.$apply();
            });
            return SmsHandler.start().$promise;
        }).then(function (response) {
            console.log("response fom smshandler.start");
            console.log(response);
            $rootScope.sipProxy = response.sipproxy;
            $rootScope.wsProtocol = response.wsprotocol;

            var socket = new JsSIP.WebSocketInterface($rootScope.wsProtocol + '://' + $rootScope.sipProxy);

            //JsSIP configuration:
            var configuration = {
                sockets: [socket],
                uri: 'sip:' + $rootScope.msisdn + '@' + $rootScope.sipProxy,
                password: 'ONEmP@$$w0rd2016',
                useUpdate: false,
                register: false,
                use_preloaded_route: false,
                register_expires: 120
            };
    
            // For debug run this in the browser's console and reload the page:
            // JsSIP.debug.enable('JsSIP:*');
    
            phoneONEm = new JsSIP.UA(configuration);
    
            phoneONEm.registrator().setExtraHeaders([
                'X-WEBRTC-UA: zoiper'
            ]);

            phoneONEm.start();
            phoneONEm.register();

            return Phone.start(response);

        }).then(function (response) {
            console.log("finished call to phone.start");
            $scope.$parent.spinner = true;
            return Cache.getServices();
        }).then(function (services) {

            phoneONEm.on('newRTCSession', function (data) {

                data.session.on("progress", function (e, data) {
                    console.log("[WS]: newRTCSession - progress");
                    $rootScope.$emit('progress', data);
                });

                console.log("main: new RTC session");
                //$rootScope.$emit('_onemNewRTCSession', data);
                var cs = Cache.getCallService();
                $state.go('service', { service: cs, initialize: false, template: cs.service.template, rtcData: data });
            });

            if ($scope.$parent) $scope.$parent.spinner = false;

            $scope.$parent.services1 = [];
            $scope.$parent.services2 = [];

            console.log("cache got response");
            console.log(services);
            // $timeout(function () {
            // anything you want can go here and will safely be run on the next digest.
            for (var i = 0; i < services.length; i += 2) {
                $scope.$parent.services1.push(services[i]);
            }
            for (var i = 1; i < services.length; i += 2) {
                $scope.$parent.services2.push(services[i]);
            }
            //   $rootScope.$apply();
            // });
            resolveState();
        }).catch(function (error) {

            //  debugger;
            if ($scope.$parent) $scope.$parent.spinner = false;

            console.log("error in main ");
            console.log(error);
            if (error == null) {
                resolveState();
            } else if (!$rootScope.msisdn) {
                console.log("no msisdn, going to capture");
                $state.go('captureMsisdn');
            } else {
                if (error) toastr.error(error);
            }
        });

    }
]);
