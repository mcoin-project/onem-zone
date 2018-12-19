ONEmSimModule.controller('captureTokenController', [
    '$scope',
    'User',
    'toastr',
    '$state',
    function($scope, User, toastr, $state) {
        $scope.submit = function() {
            var msisdn = $scope.msisdn.slice(1); // remove +
            User.sendToken( {msisdn: msisdn} ). $promise.then(function(response) {
                $state.go('captureToken');
                //return updateMsisdn( {msisdn: msisdn} ).$promise.then(function(response) {
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
    function($scope, User, toastr, $state) {
        $scope.submit = function() {
            var msisdn = $scope.msisdn.slice(1); // remove +
            User.sendToken( {msisdn: msisdn} ). $promise.then(function(response) {
            //    $state.go('captureToken');
                //return updateMsisdn( {msisdn: msisdn} ).$promise.then(function(response) {
            }).catch(function(error) {
                toastr.error("Couldn't update mobile number - please try again");
            });
        }
    }
]);