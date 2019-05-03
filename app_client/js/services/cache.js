
ONEmSimModule.factory('Cache', [
    'Services',
    'MtText',
    'Request',
    'ServicesData',
    function (Services, MtText, Request, ServicesData) {

        var self = this;

        var initialized = false;

        var serviceState = {
            activeService: undefined,
            previousService: undefined
        }

        var processServicesList = async function (text) {

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
                //debugger;

                await ServicesData.loadServices(results);
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

            activeService: function(value) {
                if (typeof value == "undefined") return serviceState.activeService;
                serviceState.activeService = value;
                return serviceState.activeService; 
            }, 
            previousService: function(value) {
                if (typeof value == "undefined") return serviceState.previousService;
                serviceState.previousService = value;
                return serviceState.previousService; 
            }, 
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
            getCallService: function () {
                if (ServicesData.services()) {
                    return ServicesData.services().getCallService();
                } else {
                    return false;
                }
            },
            getLandingService: function () {
                if (ServicesData.services()) {
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
                    var result = processServicesList(mt);
                    serviceState.activeService = ServicesData.services().getLandingService();
                    serviceState.previousService = serviceState.activeService;
                    return result;
                } catch (error) {
                    throw "Error getting services, try again later";
                }
            },
            getService: async function (service) {

                console.log("requesting:" + '#' + service.getName());

                if (service.service.blockRequest) {
                    console.log("blocking request");
                    return false;
                }

                try {
                    serviceState.previousService = serviceState.activeService;
                    var mt = await Request.get('#' + service.getName());
                    serviceState.activeService = service;
                    console.log("back from getService request:");
                    console.log(serviceState);
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
