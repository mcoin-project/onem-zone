ONEmSimModule.controller('navbarController', [
    '$scope',
    '$rootScope',
    '$timeout',
    '$auth',
    '$state',
    '$location',
    'Cache',
    'DataModel',
    'Socket',
    'Phone',
    'SmsHandler',
    'User',
    function ($scope, $rootScope, $timeout, $auth, $state, $location, Cache, DataModel, Socket, Phone, SmsHandler, User) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.agree = function() {
            $state.go('logoutDelete');
        }

        $scope.$on('error', function (ev, data) {
            console.log("[MN]: socket error:" + ev);
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:LOGOUT', function (ev, data) {
            $location.path('/logout');
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $rootScope.$apply();
            });
        });

        $scope.$on('socket:MT SMS', function (ev, data) {
            $scope.theData = data;

            console.log("[MN]: MT received:");
            console.log(data);

            var outputObj = {
                type: "mt",
                value: data.mtText
            };

            $scope.results = DataModel.addResult(outputObj);

        });

        $scope.smsInput = function () {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results = DataModel.addResult(inputObj);
            console.log("[MN]: calling emit");
            Socket.emit('MO SMS', $scope.smsText);
            $scope.smsText = '';
        };

        $scope.$on('socket:API MT SMS', function (ev, data) {
            console.log("getService: received MT");
            console.log(data);

            Cache.receivedMt(data.mtText);

        });

        // $scope.services1 = [
        //     { name: 'account' , icon: '3d_rotation', template: 'cards' },
        //     { name: 'aljazeera' , icon: 'accessibility', template: 'cards' },
        //     { name: 'contacts' , icon: 'account_circle', template: 'cards' },
        //     { name:  'france24' , icon: 'alarm', template: 'cards' },
        //     { name:  'market' , icon: 'all_out', template: 'cards' },
        //     { name:  'msg' , icon: 'build', template: 'cards' }
        // ];

        // $scope.services2 = [
        //     { name:  'onem' , icon: 'done', template: 'cards' },
        //     { name:  'reuters' , icon: 'favorite', template: 'cards' },
        //     { name:  'subscribe', icon: 'find_replace', template: 'cards' },
        //     { name:  'xgroup', icon: 'feedback', template: 'cards' },
        //     { name:  'unsubscribe', icon: 'help_outline', template: 'cards' }
        // ];

        Promise.resolve().then(function () {
            if (!$rootScope.msisdn) {
                return User.getMsisdn().$promise;
            } else {
                return { msisdn: $rootScope.msisdn };
            }
        }).then(function (response) {
            console.log("setting msisdn:" + response.msisdn);
            $rootScope.msisdn = response.msisdn;
            $rootScope.user = response.user;
            //$state.go('apphome');
            return SmsHandler.start().$promise;
        }).then(function (response) {
            console.log("response fom smshandler.start");
            console.log(response);
            return Phone.start(response);
        }).then(function (response) {
            console.log("finished call to phone.start");
            return Cache.getServices($scope);
        }).then(function (services) {
            $scope.services = services;
            $scope.services1 = [];
            $scope.services2 = [];

            for (var i=0; i<$scope.services.length; i+=2) {
                $scope.services1.push($scope.services[i]);
            }
            for (var i=1; i<$scope.services.length; i+=2) {
                $scope.services2.push($scope.services[i]);
            }
            console.log("cache got response");
            console.log(services);

            $state.go('apphome');
        }).catch(function (error) {
            console.log(error);
            if (!$rootScope.msisdn) {
                console.log("no msisdn, going to capture");
                $state.go('captureMsisdn');
            }
        });

    }
]);
