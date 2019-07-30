module.exports = function (app) {
    app.service('readyToSendInternalService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        Internal,
                                                        _,
                                                        employeeService,
                                                        dialog,
                                                        langService,
                                                        toast,
                                                        cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'readyToSendInternalService';

        self.readyToSendInternals = [];

        /**
         * @description Load the ready to send internal mails from server.
         * @returns {Promise|readyToSendInternals}
         */
        self.loadReadyToSendInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/ready-to-sent').then(function (result) {
                self.readyToSendInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.readyToSendInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.readyToSendInternals);
                return self.readyToSendInternals;
            });
        };

        /**
         * @description Get ready to send internal mails from self.readyToSendInternals if found and if not load it from server again.
         * @returns {Promise|readyToSendInternals}
         */
        self.getReadyToSendInternals = function () {
            return self.readyToSendInternals.length ? $q.when(self.readyToSendInternals) : self.loadReadyToSendInternals();
        };

        /**
         * @description Contains methods for CRUD operations for ready to send internal mails
         */
        self.controllerMethod = {

        };

        /**
         * @description Get ready to send internal mail by readyToSendInternalId
         * @param readyToSendInternalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getReadyToSendInternalById = function (readyToSendInternalId) {
            readyToSendInternalId = readyToSendInternalId instanceof Internal ? readyToSendInternalId.id : readyToSendInternalId;
            /*  return _.find(self.readyToSendInternals, function (readyToSendInternal) {
                  return Number(readyToSendInternal.id) === Number(readyToSendInternalId);
              });*/
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param readyToSendInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReadyToSendInternal = function (readyToSendInternal, editMode) {
            var sendInternalsToFilter = self.readyToSendInternals;
            if (editMode) {
                sendInternalsToFilter = _.filter(sendInternalsToFilter, function (sendInternalToFilter) {
                    return sendInternalToFilter.id !== readyToSendInternal.id;
                });
            }
            return _.some(_.map(sendInternalsToFilter, function (existingSendInternal) {
                return existingSendInternal.arName === readyToSendInternal.arName
                    || existingSendInternal.enName.toLowerCase() === readyToSendInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReadyToSendInternal, self.updateReadyToSendInternal);
    });
};
