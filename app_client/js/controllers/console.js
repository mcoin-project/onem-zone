
ONEmSimModule.controller('consoleController', [
    '$scope',
    'DataModel',
    'Socket',
    function ($scope, DataModel, Socket) {

        $scope.history = [];

        $scope.results = DataModel.getResults();

        $scope.smsInput = function () {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results = DataModel.addResult(inputObj);
            console.log("[MN]: calling emit");
            Socket.emit('MO SMS', $scope.smsText);
            $scope.smsText = '';
        };
    }
]);
