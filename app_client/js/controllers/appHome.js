
ONEmSimModule.controller('appHomeController', [
    '$scope',
    'SmsHandler',
    'Cache',
    'Phone',
    'DataModel',
    'Socket',
    '$state',
    '$rootScope',
    '$location',
    function ($scope, SmsHandler, Cache, Phone, DataModel, Socket, $state, $rootScope, $location) {

        // SmsHandler.start().$promise.then(function (response) {
        //     console.log("response fom smshandler.start");
        //     console.log(response);
        //     return Phone.start(response);
        // }).then(function (response) {
        //     console.log("finished call to phone.start");
        //     return Cache.getServices($scope);
        // }).then(function (services) {
        //     $scope.services = services;
        //     console.log("cache got response");
        //     console.log(services);
        //     $scope.services = services;
        // }).catch(function(error) {
        //     console.log(error);
        // });
    }
]);
