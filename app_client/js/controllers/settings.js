ONEmSimModule.controller('settingsController', [
    '$scope',
    'User',
    '$state',
    'DataModel',
    'ngDialog',
    function ($scope, User, $state, DataModel, ngDialog) {

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
                DataModel.clearTouchResult();
            });
            console.log($scope.$parent.emailCheckboxModel);
        }

        $scope.unlink = function () {
            ngDialog.open({
                template: 'partials/modals/modal-unlink.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', 'ngDialog', '$state', function($scope, ngDialog, $state) {
                    $scope.confirm = function() {
                        ngDialog.close();
                        $state.go('logoutDelete');
                    }
                }],
                showClose: true
            });
        }

    }
]);
