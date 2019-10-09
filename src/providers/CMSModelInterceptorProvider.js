module.exports = function (app) {
    app.provider('CMSModelInterceptor', function () {
        'ngInject';
        var self = this, modelInterceptors = {};

        self.$get = function ($log) {
            'ngInject';

            /**
             * check model interceptor if not found make one
             * @param modelName
             * @return {boolean}
             */
            function checkModelInterceptor(modelName) {
                if (!modelInterceptors.hasOwnProperty(modelName)) {
                    modelInterceptors[modelName] = {};
                }
                return true;
            }

            /**
             * check event interceptor in not found make one
             * @param modelName
             * @param eventName
             * @return {boolean}
             */
            function checkEventModelInterceptor(modelName, eventName) {
                if (!modelInterceptors[modelName].hasOwnProperty(eventName)) {
                    modelInterceptors[modelName][eventName] = [];
                }
                return true;
            }

            /**
             * assign event to interceptor model
             * @param modelName
             * @param eventName
             * @param callback
             */
            function addEvent(modelName, eventName, callback) {
                modelInterceptors[modelName][eventName].push(callback);
            }

            /**
             * check if model has the given event or not
             * @param modelName
             * @param eventName
             * @return {boolean|*}
             */
            function hasEvents(modelName, eventName) {
                return modelInterceptors.hasOwnProperty(modelName) && modelInterceptors[modelName].hasOwnProperty(eventName);
            }

            /**
             * get event handler for the model
             * @param modelName
             * @param eventName
             * @return {*}
             */
            function getEvent(modelName, eventName) {
                return modelInterceptors[modelName][eventName];
            }

            return {
                /**
                 * @description this method to assign callback to send Event
                 * @param modelName model name that you need to assign to event
                 * @param callback the function that you need to run when event {send} fired up.
                 */
                whenSendModel: function (modelName, callback) {
                    checkModelInterceptor(modelName);
                    checkEventModelInterceptor(modelName, 'send');
                    addEvent(modelName, 'send', callback);
                },
                /**
                 * @description this method to assign callback to {received} Event
                 * @param modelName model name that you need to assign to event
                 * @param callback the function that you need to run when event {received} fired up.
                 */
                whenReceivedModel: function (modelName, callback) {
                    checkModelInterceptor(modelName);
                    checkEventModelInterceptor(modelName, 'received');
                    addEvent(modelName, 'received', callback);
                },
                /**
                 * @description this method to assign callback to {init} Event
                 * @param modelName model name that you need to assign to event
                 * @param callback the function that you need to run when event {init} fired up.
                 */
                whenInitModel: function (modelName, callback) {
                    checkModelInterceptor(modelName);
                    checkEventModelInterceptor(modelName, 'init');
                    addEvent(modelName, 'init', callback);
                },
                /**
                 * @description this method run all event callback if found for the model end event name
                 * @param modelNames required to search if model registered on interceptors or not
                 * @param eventName required to search if model registered on interceptors or not
                 * @param instance
                 */
                runEvent: function (modelNames, eventName, instance) {
                    if (!angular.isArray(modelNames)) {
                        modelNames = [modelNames];
                    }

                    for (var index = 0; index < modelNames.length; index++) {
                        var modelName = modelNames[index];
                        // if not have the event return the model
                        if (!hasEvents(modelName, eventName)) {
                            return instance;
                        }
                        // run the event callbacks when found
                        var event = getEvent(modelName, eventName);
                        for (var i = 0; i < event.length; i++) {
                            instance = event[i](instance);
                            if (!instance)
                                throw Error(encodeURIComponent("this Model" + modelName + "has interceptor but you missing to return the model in event: " + eventName));
                        }
                    }
                    // return the model again
                    return instance;
                }

            }
        }
    });
};
