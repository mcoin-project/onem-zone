
ONEmSimModule.factory('Cache', [
    'Services',
    'MtText',
    'Request',
    'ServicesData',
    function (Services, MtText, Request, ServicesData) {

        var initialized = false;

        var processServicesList = function (text) {

            if (!text) throw "missing parameter";

            var texts = []; // array

            if (!Array.isArray(text)) {
                texts.push(text);
            } else {
                texts = text;
            }

            var activeServices = [];
            var results = [];

            for (var i = 0; i < texts.length; i++) {
                console.log("text");
                console.log(texts[i]);
                var mtText = new MtText(texts[i]);

                if (mtText.isServicesList()) {
                    mtText.body.filter(function (b) {
                        if (b.type == "options") {
                            b.options.filter(function (o) {
                                results.push(o.desc.slice(1).toLowerCase());
                            });
                        }
                    });

                }
            }

            if (results.length > 0) {
                console.log("results");
                console.log(results);

                ServicesData.services(results);
                activeServices = ServicesData.services().generateMenuItems();
            }

            console.log("activeServices");
            console.log(activeServices);
            if (activeServices.length > 0) {
                initialized = true;
            }
            return activeServices;
        }

        var processService = function (mtText) {

            if (!mtText) throw "missing mtText";

            var result = new MtText(mtText);
            var type = !result.hideInput() ? "input" : "menu";

            console.log({
                header: result.header,
                footer: result.footer,
                preBody: result.preBody,
                body: result.body,
                buttons: result.buttons,
                type: type,
                pages: result.pages.numPages,
                currentPage: result.pages.currentPage,
                breadcrumbs: result.breadcrumbs
            });

            return {
                header: result.header,
                footer: result.footer,
                preBody: result.preBody,
                body: result.body,
                buttons: result.buttons,
                type: type,
                pages: result.pages.numPages,
                currentPage: result.pages.currentPage,
                breadcrumbs: result.breadcrumbs
            };
        }

        return {

            reset: function () {
                initialized = false;
                activeServices = [];
                return true;
            },
            isInitialized: function () {
                return initialized;
            },
            getGoCommand: function () {
                if (ServicesData.services()) {
                    return ServicesData.services().getGoCommand();
                } else {
                    return 'go';
                }
            },
            getLandingService: function () {
                if (ServicesData.services) {
                    return ServicesData.services().getLandingService();
                } else {
                    return false;
                }
            },
            getServices: async function () {

                try {
                    var mt = await Request.get('#', { method: 'api', all: true });
                    console.log("back from api request:");
                    console.log(mt);
                    return processServicesList(mt);
                } catch (error) {
                    throw error;
                }
            },
            getService: async function (service) {

                console.log("requesting:" + '#' + service);

                try {
                    var mt = await Request.get('#' + service);
                    console.log("back from getService request:");
                    console.log(mt);
                    return processService(mt);
                } catch (error) {
                    throw error;
                }
            },
            selectOption: async function (inputText) {

                console.log("requesting:" + inputText);
                try {
                    var mt = await Request.get(inputText);
                    console.log("back from selectOption request:");
                    console.log(mt);
                    return processService(mt);
                } catch (error) {
                    throw error;
                }
            }
        }
    }
]);
