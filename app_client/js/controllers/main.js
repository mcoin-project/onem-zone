ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'Cache',
    'SmsHandler',
    'Socket',
    'User',
    'Phone',
    '$location',
    '$timeout',
    'Cache',
    function ($scope, $rootScope, $state, Cache, SmsHandler, Socket, User, Phone, $location, $timeout, Cache) {

        $scope.selected = { country: '' };

        $scope.history = [];

        console.log("[MN]: mainController initialising");

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
            return Cache.getServices();
        }).then(function (services) {

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

            $state.go('service', { initialize: true, service: Cache.getLandingService() });
        }).catch(function (error) {

            //  debugger;
            console.log("error in main " + error);
            if (!$rootScope.msisdn) {
                console.log("no msisdn, going to capture");
                $state.go('captureMsisdn');
            }
        });
    }
]);
