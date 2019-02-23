ONEmSimModule.controller('settingsController', [
    '$scope',
    'User',
    function ($scope, User) {

        User.getProfile().$promise.then(function (response) {
            $scope.$parent.checkboxModel = {
                on: response.user.touchMode
            };
        });

        $scope.changed = function () {
            User.setProfile({ touchMode: $scope.$parent.checkboxModel.on }).$promise.then(function (response) {
                $scope.$parent.checkboxModel = {
                    on: response.user.touchMode
                };
            });
            console.log($scope.$parent.checkboxModel);
        }
    }
]);
