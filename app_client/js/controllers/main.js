ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'Cache',
    'DataModel',
    'Socket',
    'User',
    'Phone',
    '$location',
    '$timeout',
    function ($scope, $rootScope, $state, Cache, DataModel, Socket, User, Phone, $location, $timeout) {

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

            $state.go('apphome', { service: Cache.getLandingService() });
        }).catch(function (error) {
            console.log("no msisdn, going to capture");
            $state.go('captureMsisdn');
        });
    }
]);
