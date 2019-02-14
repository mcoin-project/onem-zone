ONEmSimModule.controller('captureTokenController', [
    '$scope',
    'User',
    'toastr',
    '$state',
    '$rootScope',
    '$timeout',
    function ($scope, User, toastr, $state, $rootScope, $timeout) {
        $scope.submit = function () {
            User.verifyToken({ token: $scope.token }).$promise.then(function (response) {
                if (response.status) {
                    return User.updateMsisdn({ msisdn: $rootScope.msisdn }).$promise;
                } else {
                    throw "Invalid token - please try again";
                }
            }).then(function (response) {
                toastr.success("Mobile number linked successfully");
                console.log("mobile linked:")
                $timeout(function () {
                    $rootScope.user = response.user;
                    $rootScope.$apply();
                });
                console.log($rootScope.user);
                $state.go('landing');
            }).catch(function (error) {
                toastr.error(error);
            });
        }

        $scope.resendCode = function () {
            User.sendToken({ msisdn: $rootScope.msisdn }).$promise.then(function () {
                console.log("sent ok");
                toastr.success("A new code was sent to: " + $rootScope.msisdn)
            }).catch(function (error) {
                console.log(error);
                toastr.error("Couldn't update mobile number - please try again");
            });
        }

    }
]);