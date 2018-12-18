ONEmSimModule.controller('loginController', [
    '$scope',
    '$rootScope',
    '$timeout',
    '$location',
    '$auth',
    'toastr',
    function($scope, $rootScope, $timeout, $location, $auth, toastr) {
        $scope.authenticate = function(provider) {
            console.log("inside authenticate");
            debugger;
            $auth.authenticate(provider).then(function() {
                console.log("called authenticate");
                toastr.success('You have successfully signed in with ' + provider + '!');
                $location.path('/');
            }).catch(function(error) {
                console.log("authentication error");
                console.log(error);
                if (error.message) {
                    // Satellizer promise reject error.
                    toastr.error(error.message);
                } else if (error.data) {
                    // HTTP response error from server
                    toastr.error(error.data.message, error.status);
                } else {
                    toastr.error(error);
                }
            });

            console.log("reached end");
        }
    }
]);