ONEmSimModule.factory('Services', function () {

    var services = [
        { name: 'market', template: 'cards' }
    ];

    return {
        services: services,
        getService: function (name) {
            for (var i = 0; i < services.length; i++) {
                if (services[i].name == name) {
                    break;
                }
            }
            if (i == services.length) {
                return -1;
            } else {
                return services[i];
            }
        }
    };
});