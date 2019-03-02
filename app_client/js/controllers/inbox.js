ONEmSimModule.controller('inboxController', [
    '$scope',
    '$rootScope',
    'DataModel',
    'MtText',
    function ($scope, $rootScope, DataModel, MtText) {
        

        $scope.messages = [];
        
        var refreshInbox = function() {
            $scope.messages = DataModel.getInbox();
        }

        refreshInbox();

        // $rootScope.$on('_onemUpdateInbox', function(event, result) {
        //     refreshInbox();
        // });

        $scope.readMessage = function(message, index) {
            message = DataModel.readMessage(index);
            $rootScope.$broadcast('_onemUpdateInbox');
        }

        $scope.deleteMessage = function(message, index) {

            var i = index + 1;  // the deleteMessage function expects an index starting with 1
            console.log("deleteMessage:"+i);

            $scope.messages = DataModel.deleteMessage(i);
            refreshInbox();

            $rootScope.$broadcast('_onemUpdateInbox');

            console.log($scope.messages);
        }
    }
]);
