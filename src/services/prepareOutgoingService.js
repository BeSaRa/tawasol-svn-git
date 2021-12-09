module.exports = function (app) {
    app.service('prepareOutgoingService', function (urlService,
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
        self.serviceName = 'prepareOutgoingService';

        self.prepareOutgoings = [];

        /**
         * @description Load the prepare outgoing mails from server.
         * @returns {Promise|prepareOutgoings}
         */
        self.loadPrepareOutgoings = function () {
            // var ou = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.prepareOutgoings.change({id: employeeService.getEmployee().getOUID()})).then(function (result) {
                self.prepareOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.prepareOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.prepareOutgoings);
                return self.prepareOutgoings;
            });
        };

        /**
         * @description Get prepare outgoing mails from self.prepareOutgoings if found and if not load it from server again.
         * @returns {Promise|prepareOutgoings}
         */
        self.getPrepareOutgoings = function () {
            return self.prepareOutgoings.length ? $q.when(self.prepareOutgoings) : self.loadPrepareOutgoings(ou);
        };

        /**
         * @description Contains methods for CRUD operations for prepare outgoing mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove prepare outgoing mail
             * @param prepareOutgoing
             * @param $event
             */
            prepareOutgoingRemove: function (prepareOutgoing, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: prepareOutgoing.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removePrepareOutgoing(prepareOutgoing).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: prepareOutgoing.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk prepare outgoing mails
             * @param prepareOutgoings
             * @param $event
             */
            prepareOutgoingRemoveBulk: function (prepareOutgoings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkPrepareOutgoings(prepareOutgoings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === prepareOutgoings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (prepareOutgoing) {
                                        return prepareOutgoing.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("remove_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Delete given prepare outgoing mail.
         * @param prepareOutgoing
         * @return {Promise|null}
         */
        self.removePrepareOutgoing = function (prepareOutgoing) {
            var vsId = prepareOutgoing.hasOwnProperty('vsId') ? prepareOutgoing.vsId : prepareOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk prepare outgoing mails.
         * @param prepareOutgoings
         * @return {Promise|null}
         */
        self.removeBulkPrepareOutgoings = function (prepareOutgoings) {
            var bulkVsIds = prepareOutgoings[0].hasOwnProperty('vsId') ? _.map(prepareOutgoings, 'vsId') : prepareOutgoings;
            return $http.put(urlService.outgoings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedPrepareOutgoings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedPrepareOutgoings.push(key);
                });
                return _.filter(prepareOutgoings, function (prepareOutgoing) {
                    return (failedPrepareOutgoings.indexOf(prepareOutgoing.vsId) > -1);
                });
            });
        };

        /**
         * @description Get prepare outgoing mail by prepareOutgoingId
         * @param prepareOutgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getPrepareOutgoingById = function (prepareOutgoingId) {
            prepareOutgoingId = prepareOutgoingId instanceof Outgoing ? prepareOutgoingId.id : prepareOutgoingId;
            return _.find(self.prepareOutgoings, function (prepareOutgoing) {
                return Number(prepareOutgoing.id) === Number(prepareOutgoingId);
            });
        };

        /**
         * @description Send the item to draft
         * @param prepareOutgoing
         */
        self.sendToDraftPrepareOutgoing = function (prepareOutgoing) {
            var vsId = prepareOutgoing.hasOwnProperty('vsId') ? prepareOutgoing.vsId : prepareOutgoing;
            return $http
                .put(urlService.outgoings + "/" + vsId + '/send-to-draft')
                .then(function (result) {
                    return prepareOutgoing;
                });
        };


        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param prepareOutgoing
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePrepareOutgoing = function (prepareOutgoing, editMode) {
            var prepareOutgoingsToFilter = self.prepareOutgoings;
            if (editMode) {
                prepareOutgoingsToFilter = _.filter(prepareOutgoingsToFilter, function (prepareOutgoingToFilter) {
                    return prepareOutgoingToFilter.id !== prepareOutgoing.id;
                });
            }
            return _.some(_.map(prepareOutgoingsToFilter, function (existingPrepareOutgoing) {
                return existingPrepareOutgoing.arName === prepareOutgoing.arName
                    || existingPrepareOutgoing.enName.toLowerCase() === prepareOutgoing.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePrepareOutgoing, self.updatePrepareOutgoing);
    });
};
