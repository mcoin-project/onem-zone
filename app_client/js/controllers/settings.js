ONEmSimModule.controller('settingsController', [
    '$scope',
    'User',
    '$state',
    'DataModel',
    function ($scope, User, $state, DataModel) {

        User.getProfile().$promise.then(function (response) {
            $scope.$parent.touchCheckboxModel = {
                on: response.user.touchMode
            };
            $scope.$parent.emailCheckboxModel = {
                on: !response.user.dontSendEmails
            };            
        });

        $scope.agree = function () {
            console.log("agree")
            $state.go('logoutDelete');
        }

        $scope.touchChanged = function () {
            User.setProfile({ touchMode: $scope.$parent.touchCheckboxModel.on }).$promise.then(function (response) {
                console.log("setProfile:");
                console.log(response);
                $scope.$parent.touchCheckboxModel = {
                    on: response.user.touchMode
                };
                DataModel.clearTouchResult();

            });
            console.log($scope.$parent.touchCheckboxModel);
        }

        $scope.emailChanged = function () {
            User.setProfile({ dontSendEmails: !$scope.$parent.emailCheckboxModel.on }).$promise.then(function (response) {
                console.log("setProfile:");
                console.log(response);
                $scope.$parent.emailCheckboxModel = {
                    on: !response.user.dontSendEmails
                };
            });
            console.log($scope.$parent.emailCheckboxModel);
        }

    }
]);
