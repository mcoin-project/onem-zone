ONEmSimModule.controller('inboxController', [
    '$scope',
    '$rootScope',
    'DataModel',
    'Cache',
    '$timeout',
    'toastr',
    function ($scope, $rootScope, DataModel, Cache, $timeout, toastr) {
        
        $scope.messages = [];

        var refreshInbox = function() {
            $scope.messages = DataModel.getInbox();
        }

        refreshInbox();

        $scope.readMessage = function(message, index) {
            $scope.moTextInbox = "";

            message = DataModel.readMessage(index);
            var line0 = message.content.lines[0];
            $rootScope.$broadcast('_onemUpdateInbox');
            if (line0.startsWith('@') && line0.includes(':')) {
                $scope.moTextInbox = line0.slice(0, line0.indexOf(':')) + ' ';
            }
        }
        

        $scope.moSubmitFromInbox = function () {
            console.log("motext:" + $scope.moText);
            if (!$scope.moTextInbox || $scope.moTextInbox.length == 0) return;
            $scope.$parent.spinner = true;
            Cache.selectOption($scope.moTextInbox).then(function (response) {
                console.log("got response");

                $timeout(function () {
                    $scope.$parent.spinner = false;
                    $rootScope.$apply();
                });

                $scope.moTextInbox = "";
             //   applyResult(response);
            }).catch(function (error) {
                console.log("parent:")
                console.log($scope.$parent);
                $timeout(function () {
                    $scope.$parent.spinner = false;
                    $rootScope.$apply();
                });
                console.log(error);
                toastr.error(error);
            });
        }
        $scope.deleteMessage = function(message, index) {

            $('.collapsible').collapsible('close',index);
            var i = index + 1;  // the deleteMessage function expects an index starting with 1
            console.log("deleteMessage:"+i);

            $scope.messages = DataModel.deleteMessage(i);
            refreshInbox();

            $rootScope.$broadcast('_onemUpdateInbox');

            console.log($scope.messages);
        }
    }
]);
