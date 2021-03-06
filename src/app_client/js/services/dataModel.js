ONEmSimModule.factory('DataModel', [
    '$rootScope',
    'MtText',
    function ($rootScope, MtText) {

        var removeIndex = function (s, index) {
            if (index <= 0 || index > index.length) return s;
            return s.slice(0, index - 1).concat(s.slice(index, s.length));
        }

        var data = {
            results: [],
            inbox: [],
            touchResult: undefined,
            spinner: false,
            accounts: [],
            selectedAccount: 0,
        };

        return {
            data: data,
            selectedAccount: function (index) {
                if (typeof index == "undefined") return data.selectedAccount;
                data.selectedAccount = index;
                return data.selectedAccount;
            },
            getResults: function () {
                return data.results;
            },
            addResult: function (result) {
                data.results.push(result);
                return data.results;
            },
            clearResults: function () {
                data.results = [];
                return data.results;
            },
            accounts: function (accounts) {
                if (typeof accounts == "undefined") return data.accounts;
                data.accounts = accounts;
                return data.accounts;
            },
            addAccount: function (account) {
                data.accounts.push(account);
                return data.accounts;
            },
            clearAccounts: function () {
                data.accounts = [];
                return data.accounts;
            },
            setSpinner: function (s) {
                data.spinner = s;
                return data.spinner;
            },
            getSpinner: function () {
                return data.spinner;
            },
            getInbox: function () {
                return data.inbox;
            },
            getTouchResult: function () {
                return data.touchResult;
            },
            setTouchResult: function (result) {
                data.touchResult = result;
                return data.touchResult;
            },
            clearTouchResult: function () {
                data.touchResult = undefined;
                return data.touchResult;
            },
            addMessage: function (message) {

                var obj = {
                    timestamp: new Date(),
                    content: new MtText(message),
                    state: "unread"
                };

                data.inbox.unshift(obj);
                // event gets picked up in nav controller
                $rootScope.$broadcast('_onemUpdateInbox');
                return data.inbox;
            },
            clearInbox: function () {
                data.inbox = [];
                return data.inbox;
            },
            deleteMessage: function (index) {
                if (typeof index == "undefined") return data.inbox;
                data.inbox = removeIndex(data.inbox, index);
                return data.inbox;
            },
            readMessage: function (index) {
                if (typeof index == "undefined") return data.inbox;
                data.inbox[index].state = "read";
                return data.inbox[index];
            },
            getInboxCounts: function () {
                var j = 0;
                for (i = 0; i < data.inbox.length; i++) {
                    if (data.inbox[i].state == 'unread') {
                        j++;
                    }
                }
                return {
                    total: data.inbox.length,
                    unread: j,
                    read: data.inbox.length - j
                };
            }
        }
    }
]);