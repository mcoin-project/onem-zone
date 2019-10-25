ONEmSimModule.controller('walletController', [
    '$scope',
    'Wallet',
    'toastr',
    'ngDialog',
    'DataModel',
    function ($scope, Wallet, toastr, ngDialog, DataModel) {

        DataModel.clearAccounts();

        Wallet.getAccounts().$promise.then(function(response) {
            console.log("got result:");
            console.log(response.accounts);
            DataModel.accounts(response.accounts);
            $scope.accounts = response.accounts;
        }).catch(function(error) {
            console.log(error);
            toastr.error("Could not retrieve wallets"); 
        });

        $scope.topUp = function (index) {
            DataModel.selectedAccount(index);
            ngDialog.open({
                template: 'partials/modals/modal-top-up.html',
                className: 'ngdialog-theme-default',
                controller: 'modalTopUpController',
                scope: $scope,
                showClose: true
            });
        };
    }
]);
