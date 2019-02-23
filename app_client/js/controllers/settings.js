ONEmSimModule.controller('settingsController', [
    '$scope',
    'User',
    '$state',
    function ($scope, User, $state) {

        User.getProfile().$promise.then(function (response) {
            $scope.$parent.checkboxModel = {
                on: response.user.touchMode
            };
        });

        $scope.agree = function () {
            console.log("agree")
            $state.go('logoutDelete');
        }

        $scope.changed = function () {
            User.setProfile({ touchMode: $scope.$parent.checkboxModel.on }).$promise.then(function (response) {
                console.log("setProfile:");
                console.log(response);
                $scope.$parent.checkboxModel = {
                    on: response.user.touchMode
                };
            });
            console.log($scope.$parent.checkboxModel);
        }
    }
]);
