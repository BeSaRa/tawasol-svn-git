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
            return $http.get(urlService.incomings + 'ou/' + employeeService.getEmployee().getOUID() + '/ready-to-sent').then(function (result) {
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
            /**
             * @description Archive the ready to send incoming mail
             * @param readyToSendIncoming
             * @param $event
             */
            readyToSendIncomingArchive: function (readyToSendIncoming, $event) {
                return self.archiveReadyToSendIncoming(readyToSendIncoming)
                    .then(function () {
                        toast.success(langService.get("archive_specific_success").change({name: readyToSendIncoming.getTranslatedName()}));
                        return true;
                    });
            },
            /**
             * @description Archive bulk ready to send incoming mails
             * @param readyToSendIncomings
             * @param $event
             */
            readyToSendIncomingArchiveBulk: function (readyToSendIncomings, $event) {
                return self.archiveBulkReadyToSendIncoming(readyToSendIncomings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToSendIncomings.length) {
                            toast.error(langService.get("failed_archive_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('archive_success_except_following', _.map(result, function (readyToSendIncoming) {
                                return readyToSendIncoming.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("archive_success"));
                            response = true;
                        }
                        return response;
                    });
            }
        };

        /**
         * @description Archive the ready to send incoming mail
         * @param readyToSendIncoming
         */
        self.archiveReadyToSendIncoming = function (readyToSendIncoming) {
            var vsId = readyToSendIncoming.hasOwnProperty('vsId') ? readyToSendIncoming.vsId : readyToSendIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/archive')
                .then(function () {
                    return readyToSendIncoming;
                });
        };

        /**
         * @description Archive the bulk ready to send incoming mail
         * @param readyToSendIncomings
         */
        self.archiveBulkReadyToSendIncoming = function (readyToSendIncomings) {
            var vsIds = readyToSendIncomings[0].hasOwnProperty('vsId') ? _.map(readyToSendIncomings, 'vsId') : readyToSendIncomings;
            return $http
                .put((urlService.incomings + '/archive/bulk'), vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToSendIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToSendIncomings.push(key);
                    });
                    return _.filter(failedReadyToSendIncomings, function (readyToSendIncoming) {
                        return (failedReadyToSendIncomings.indexOf(readyToSendIncoming.vsId) > -1);
                    });
                });
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
