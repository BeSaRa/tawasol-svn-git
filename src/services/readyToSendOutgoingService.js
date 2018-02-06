module.exports = function (app) {
    app.service('readyToSendOutgoingService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        Outgoing,
                                                        employeeService,
                                                        _,
                                                        dialog,
                                                        langService,
                                                        toast,
                                                        cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'readyToSendOutgoingService';

        self.readyToSendOutgoings = [];

        /**
         * @description Load the ready to send outgoing mails from server.
         * @returns {Promise|readyToSendOutgoings}
         */
        self.loadReadyToSendOutgoings = function () {
            return $http.get(urlService.readyToSendOutgoings.change({id: employeeService.getEmployee().getOUID()})).then(function (result) {
                self.readyToSendOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.readyToSendOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.readyToSendOutgoings);
                return self.readyToSendOutgoings;
            });
        };

        /**
         * @description Get ready to send outgoing mails from self.readyToSendOutgoings if found and if not load it from server again.
         * @returns {Promise|readyToSendOutgoings}
         */
        self.getReadyToSendOutgoings = function () {
            return self.readyToSendOutgoings.length ? $q.when(self.readyToSendOutgoings) : self.loadReadyToSendOutgoings();
        };

        /**
         * @description Contains methods for CRUD operations for ready to send outgoing mails
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new ready to send outgoing mail
             * @param $event
             */
            readyToSendOutgoingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('ready-to-send-outgoing'),
                        controller: 'readyToSendOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            readyToSendOutgoing: new Outgoing(
                                {
                                    itemOrder: generator.createNewID(self.readyToSendOutgoings, 'itemOrder')
                                }),
                            readyToSendOutgoings: self.readyToSendOutgoings
                        }
                    });
            },
            /**
             * @description Opens popup to edit ready to send outgoing mail
             * @param readyToSendOutgoing
             * @param $event
             */
            readyToSendOutgoingEdit: function (readyToSendOutgoing, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('ready-to-send-outgoing'),
                        controller: 'readyToSendOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            readyToSendOutgoing: readyToSendOutgoing,
                            readyToSendOutgoings: self.readyToSendOutgoings
                        }
                    });
            },
            /**
             * @description Show confirm box and delete ready to send outgoing mail
             * @param readyToSendOutgoing
             * @param $event
             */
            readyToSendOutgoingDelete: function (readyToSendOutgoing, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: readyToSendOutgoing.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteReadyToSendOutgoing(readyToSendOutgoing).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: readyToSendOutgoing.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk ready to send outgoing mails
             * @param readyToSendOutgoings
             * @param $event
             */
            readyToSendOutgoingDeleteBulk: function (readyToSendOutgoings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkReadyToSendOutgoings(readyToSendOutgoings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === readyToSendOutgoings.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (readyToSendOutgoing) {
                                        return readyToSendOutgoing.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description Archive the ready to send outgoing mail
             * @param readyToSendOutgoing
             * @param $event
             */
            readyToSendOutgoingArchive: function (readyToSendOutgoing, $event) {
                return self.archiveReadyToSendOutgoing(readyToSendOutgoing)
                    .then(function () {
                        toast.success(langService.get("archive_specific_success").change({name: readyToSendOutgoing.getTranslatedName()}));
                        return true;
                    });
            },
            /**
             * @description Archive bulk ready to send outgoing mails
             * @param readyToSendOutgoings
             * @param $event
             */
            readyToSendOutgoingArchiveBulk: function (readyToSendOutgoings, $event) {
                return self.archiveBulkReadyToSendOutgoing(readyToSendOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToSendOutgoings.length) {
                            toast.error(langService.get("failed_archive_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('archive_success_except_following', _.map(result, function (readyToSendOutgoing) {
                                return readyToSendOutgoing.getNames();
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
         * @description Add new ready to send outgoing mail
         * @param readyToSendOutgoing
         * @return {Promise|Outgoing}
         */
        self.addReadyToSendOutgoing = function (readyToSendOutgoing) {
            return $http
                .post(urlService.readyToSendOutgoings,
                    generator.interceptSendInstance('Outgoing', readyToSendOutgoing))
                .then(function () {
                    return readyToSendOutgoing;
                });
        };

        /**
         * @description Update the given ready to send outgoing mail.
         * @param readyToSendOutgoing
         * @return {Promise|Outgoing}
         */
        self.updateReadyToSendOutgoing = function (readyToSendOutgoing) {
            return $http
                .put(urlService.readyToSendOutgoings,
                    generator.interceptSendInstance('Outgoing', readyToSendOutgoing))
                .then(function () {
                    return readyToSendOutgoing;
                });
        };

        /**
         * @description Delete given ready to send outgoing mail.
         * @param readyToSendOutgoing
         * @return {Promise|null}
         */
        self.deleteReadyToSendOutgoing = function (readyToSendOutgoing) {
            var id = readyToSendOutgoing.hasOwnProperty('id') ? readyToSendOutgoing.id : readyToSendOutgoing;
            return $http.delete((urlService.readyToSendOutgoings + '/' + id));
        };

        /**
         * @description Delete bulk ready to send outgoing mails.
         * @param readyToSendOutgoings
         * @return {Promise|null}
         */
        self.deleteBulkReadyToSendOutgoings = function (readyToSendOutgoings) {
            var bulkIds = readyToSendOutgoings[0].hasOwnProperty('id') ? _.map(readyToSendOutgoings, 'id') : readyToSendOutgoings;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.readyToSendOutgoings + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedReadyToSendOutgoings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReadyToSendOutgoings.push(key);
                });
                return _.filter(readyToSendOutgoings, function (readyToSendOutgoing) {
                    return (failedReadyToSendOutgoings.indexOf(readyToSendOutgoing.id) > -1);
                });
            });
        };

        /**
         * @description Get ready to send outgoing mail by sendOutgoingId
         * @param readyToSendOutgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getReadyToSendOutgoingById = function (readyToSendOutgoingId) {
            readyToSendOutgoingId = readyToSendOutgoingId instanceof Outgoing ? readyToSendOutgoingId.id : readyToSendOutgoingId;
            return _.find(self.readyToSendOutgoings, function (readyToSendOutgoing) {
                return Number(readyToSendOutgoing.id) === Number(readyToSendOutgoingId);
            });
        };

        /**
         * @description Activate ready to send outgoing mail
         * @param readyToSendOutgoing
         */
        self.activateReadyToSendOutgoing = function (readyToSendOutgoing) {
            return $http
                .put((urlService.readyToSendOutgoings + '/activate/' + readyToSendOutgoing.id))
                .then(function () {
                    return readyToSendOutgoing;
                });
        };

        /**
         * @description Deactivate ready to send outgoing mail
         * @param readyToSendOutgoing
         */
        self.deactivateReadyToSendOutgoing = function (readyToSendOutgoing) {
            return $http
                .put((urlService.readyToSendOutgoings + '/deactivate/' + readyToSendOutgoing.id))
                .then(function () {
                    return readyToSendOutgoing;
                });
        };

        /**
         * @description Activate bulk of ready to send outgoing mails
         * @param readyToSendOutgoings
         */
        self.activateBulkReadyToSendOutgoings = function (readyToSendOutgoings) {
            var bulkIds = readyToSendOutgoings[0].hasOwnProperty('id') ? _.map(readyToSendOutgoings, 'id') : readyToSendOutgoings;
            return $http
                .put((urlService.readyToSendOutgoings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return readyToSendOutgoings;
                });
        };

        /**
         * @description Deactivate bulk of ready to send outgoing mails
         * @param readyToSendOutgoings
         */
        self.deactivateBulkReadyToSendOutgoings = function (readyToSendOutgoings) {
            var bulkIds = readyToSendOutgoings[0].hasOwnProperty('id') ? _.map(readyToSendOutgoings, 'id') : readyToSendOutgoings;
            return $http
                .put((urlService.readyToSendOutgoings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return readyToSendOutgoings;
                });
        };

        /**
         * @description Archive the ready to send outgoing mail
         * @param readyToSendOutgoing
         */
        self.archiveReadyToSendOutgoing = function (readyToSendOutgoing) {
            var vsId = readyToSendOutgoing.hasOwnProperty('vsId') ? readyToSendOutgoing.vsId : readyToSendOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/archive')
                .then(function () {
                    return readyToSendOutgoing;
                });
        };

        /**
         * @description Archive the bulk ready to send outgoing mail
         * @param readyToSendOutgoings
         */
        self.archiveBulkReadyToSendOutgoing = function (readyToSendOutgoings) {
            var vsIds = readyToSendOutgoings[0].hasOwnProperty('vsId') ? _.map(readyToSendOutgoings, 'vsId') : readyToSendOutgoings;
            return $http
                .put((urlService.outgoings + '/archive/bulk'), vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToSendOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToSendOutgoings.push(key);
                    });
                    return _.filter(readyToSendOutgoings, function (readyToSendOutgoing) {
                        return (failedReadyToSendOutgoings.indexOf(readyToSendOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param readyToSendOutgoing
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReadyToSendOutgoing = function (readyToSendOutgoing, editMode) {
            var sendOutgoingsToFilter = self.readyToSendOutgoings;
            if (editMode) {
                sendOutgoingsToFilter = _.filter(sendOutgoingsToFilter, function (sendOutgoingToFilter) {
                    return sendOutgoingToFilter.id !== readyToSendOutgoing.id;
                });
            }
            return _.some(_.map(sendOutgoingsToFilter, function (existingSendOutgoing) {
                return existingSendOutgoing.arName === readyToSendOutgoing.arName
                    || existingSendOutgoing.enName.toLowerCase() === readyToSendOutgoing.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReadyToSendOutgoing, self.updateReadyToSendOutgoing);
    });
};
