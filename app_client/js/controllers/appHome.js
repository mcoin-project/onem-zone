
ONEmSimModule.controller('appHomeController', [
    '$scope',
    'SmsHandler',
    'Cache',
    'Phone',
    'DataModel',
    'Socket',
    '$state',
    '$rootScope',
    '$timeout',
    function ($scope, SmsHandler, Cache, Phone, DataModel, Socket, $state, $rootScope, $timeout) {

        Cache.getService('france24').then(function (response) {

            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $scope.result = response;   
                $rootScope.$apply();
            });
            console.log("got response");
        }).catch(function (error) {
            console.log(error);
        });
    }
]);
