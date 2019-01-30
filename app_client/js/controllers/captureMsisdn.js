
ONEmSimModule.controller('captureMsisdnController', [
    '$scope',
    'User',
    'toastr',
    '$state',
    '$rootScope',
    function ($scope, User, toastr, $state, $rootScope) {
        $scope.submit = function () {
            var msisdn = $scope.msisdn.slice(1); // remove  +
            User.checkMsisdn({ msisdn: msisdn }).$promise.then(function () {
                return User.sendToken({ msisdn: msisdn }).$promise;
            }).then(function () {
                $rootScope.msisdn = msisdn;
                $state.go('captureToken');
            }).catch(function (error) {
                if (error.status == 401) {
                    toastr.error("Mobile already linked - try a different number or logout");
                } else {
                    toastr.error("Couldn't update mobile number - please try again");
                }
            });
        }
    }
]);
