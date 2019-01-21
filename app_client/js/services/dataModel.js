ONEmSimModule.factory('DataModel', function () {

    var data = {
        results: []
    };

    return {
        data: data,
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
        }
    };
});