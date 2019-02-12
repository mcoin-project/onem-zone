
ONEmSimModule.controller('serviceController', [
    '$scope',
    'SmsHandler',
    'Cache',
    'Phone',
    '$stateParams',
    'Socket',
    '$state',
    '$rootScope',
    '$location',
    function ($scope, SmsHandler, Cache, Phone, $stateParams, Socket, $state, $rootScope, $location) {

        console.log("stateParams:");
        console.log($stateParams);

        Cache.getService($stateParams.name).then(function (response) {
            console.log("got response");
        }).catch(function (error) {
            console.log(error);
        });

    }
]);
