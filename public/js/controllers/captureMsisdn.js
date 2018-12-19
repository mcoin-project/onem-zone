ONEmSimModule.controller('captureTokenController', [
    '$scope',
    'User',
    'toastr',
    '$state',
    '$rootScope',
    function($scope, User, toastr, $state, $rootScope) {
        $scope.submit = function() {
            User.verifyToken( {token: $scope.token} ).$promise.then(function(response) {
                if (response.status) {
                    return User.updateMsisdn({msisdn: $rootScope.msisdn}).$promise;
                } else {
                    throw "Invalid token - please try again";
                }
            }).then(function(response) {
                toastr.success("Mobile number linked successfully");
                $state.go('home');
            }).catch(function(error) {
                toastr.error(error);
            });
        }

        $scope.resendCode = function() {
            User.sendToken( {msisdn: $rootScope.msisdn} ).$promise.then(function(response) {
                console.log("sent ok");
                toastr.success("A new code was sent to: " + $rootScope.msisdn)
            }).catch(function(error) {
                toastr.error("Couldn't update mobile number - please try again");
            });
        }

    }
]);

ONEmSimModule.controller('captureMsisdnController', [
    '$scope',
    'User',
    'toastr',
    '$state',
    '$rootScope',
    function($scope, User, toastr, $state, $rootScope) {
        $scope.submit = function() {
            $rootScope.msisdn = $scope.msisdn.slice(1); // remove +
            User.sendToken( {msisdn: $rootScope.msisdn} ).$promise.then(function(response) {
                $state.go('captureToken');
                //return updateMsisdn( {msisdn: msisdn} ).$promise.then(function(response) {
            }).catch(function(error) {
                toastr.error("Couldn't update mobile number - please try again");
            });
        }
    }
]);