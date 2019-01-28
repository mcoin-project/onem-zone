ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'SmsHandler',
    'DataModel',
    'Socket',
    'User',
    'Phone',
    '$location',
    '$timeout',
    function ($scope, $rootScope, $state, SmsHandler, DataModel, Socket, User, Phone, $location, $timeout) {

        $scope.selected = { country: '' };

        console.log("[MN]: mainController initialising");

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

        Promise.resolve().then(function() {
            if (!$rootScope.msisdn) {
                return User.getMsisdn().$promise;
            } else {
                return {msisdn: $rootScope.msisdn};
            }
        }).then(function (response) {
            console.log("setting msisdn:" + response.msisdn);
            $rootScope.msisdn = response.msisdn;
            $rootScope.user = response.user;
            return SmsHandler.start().$promise;
        }).then(function(response) {
            console.log("response fom smshandler.start");
            console.log(response);
            return Phone.start(response);
        }).then(function(response) {
            console.log("finished call to phone.start");
            console.log(response);
        }).catch(function (error) {
            console.log(error);
            console.log("no msisdn, going to capture");
            $state.go('captureMsisdn');
        });
    }
]);
