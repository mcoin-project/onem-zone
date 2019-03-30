ONEmSimModule.controller('inboxController', [
    '$scope',
    '$rootScope',
    'DataModel',
    'Cache',
    '$timeout',
    'toastr',
    function ($scope, $rootScope, DataModel, Cache, $timeout, toastr) {
        
        $scope.messages = [];
        $scope.moTextInbox = "";
        $scope.receivedONEmName = "";

        var refreshInbox = function() {
            $scope.messages = DataModel.getInbox();
        }

        refreshInbox();

        $scope.readMessage = function(message, index) {

            message = DataModel.readMessage(index);
            var line0 = message.content.lines[0];
            $rootScope.$broadcast('_onemUpdateInbox');
            if (message.content.isMsg()) {
                $scope.receivedONEmName = line0.slice(0, line0.indexOf(':'));
                if (!$scope.receivedONEmName.startsWith('@')) {
                    $scope.receivedONEmName = '@' + $scope.receivedONEmName;
                }
            }
        }
        

        $scope.moSubmitFromInbox = function (index) {
            console.log("moSubmitFromInbox motext:" + $scope.moTextInbox);
            if (!$scope.moTextInbox || $scope.moTextInbox.length == 0) return;
            $scope.$parent.spinner = true;
            var moText = $scope.receivedONEmName + ' ' + $scope.moTextInbox;
            console.log("sending:" + moText);
            Cache.selectOption(moText).then(function (response) {
                console.log("got response");
                $('.collapsible').collapsible('close',index);

                $timeout(function () {
                    $scope.$parent.spinner = false;
                    $scope.moTextInbox = "";
                    $scope.receivedONEmName = "";
                    $rootScope.$apply();
                });

             //   applyResult(response);
            }).catch(function (error) {
                console.log("parent:")
                console.log($scope.$parent);
                $('.collapsible').collapsible('close',index);
                $scope.moTextInbox = "";
                $scope.receivedONEmName = "";

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
