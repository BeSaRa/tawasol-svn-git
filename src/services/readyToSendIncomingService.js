module.exports = function (app) {
    app.service('readyToSendIncomingService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        Incoming,
                                                        employeeService,
                                                        _,
                                                        dialog,
                                                        langService,
                                                        toast,
                                                        cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'readyToSendIncomingService';

        self.readyToSendIncomings = [];

        /**
         * @description Load the ready to send incoming mails from server.
         * @returns {Promise|Incoming}
         */
        self.loadReadyToSendIncomings = function () {
            return $http.get(urlService.incomings + '/ou/' + employeeService.getEmployee().getOUID() + '/ready-to-sent').then(function (result) {
                self.readyToSendIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.readyToSendIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.readyToSendIncomings);
                return self.readyToSendIncomings;
            });
        };

        /**
         * @description Get ready to send incoming mails from self.readyToSendIncomings if found and if not load it from server again.
         * @returns {Promise|Incoming}
         */
        self.getReadyToSendIncomings = function () {
            return self.readyToSendIncomings.length ? $q.when(self.readyToSendIncomings) : self.loadReadyToSendIncomings();
        };

        /**
         * @description Contains methods for CRUD operations for ready to send incoming mails
         */
        self.controllerMethod = {

        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param readyToSendIncoming
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReadyToSendIncoming = function (readyToSendIncoming, editMode) {
            var sendIncomingsToFilter = self.readyToSendIncomings;
            if (editMode) {
                sendIncomingsToFilter = _.filter(sendIncomingsToFilter, function (sendIncomingToFilter) {
                    return sendIncomingToFilter.id !== readyToSendIncoming.id;
                });
            }
            return _.some(_.map(sendIncomingsToFilter, function (existingSendIncoming) {
                return existingSendIncoming.arName === readyToSendIncoming.arName
                    || existingSendIncoming.enName.toLowerCase() === readyToSendIncoming.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReadyToSendIncoming, self.updateReadyToSendIncoming);
    });
};
