module.exports = function (app) {
    app.service('incomingDepartmentInboxService', function (urlService,
                                                            $http,
                                                            $q,
                                                            generator,
                                                            WorkItem,
                                                            _,
                                                            dialog,
                                                            langService,
                                                            toast,
                                                            cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'incomingDepartmentInboxService';

        self.incomingDepartmentInboxes = [];

        /**
         * @description Load the incoming department inbox items from server.
         * @returns {Promise|incomingDepartmentInboxes}
         */
        self.loadIncomingDepartmentInboxes = function () {
            return $http.get(urlService.departmentInboxes + "/all-mails").then(function (result) {
                self.incomingDepartmentInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.incomingDepartmentInboxes = generator.interceptReceivedCollection('WorkItem', self.incomingDepartmentInboxes);
                console.log(_.map(self.incomingDepartmentInboxes, 'generalStepElm.incomingVSID'));
                return self.incomingDepartmentInboxes;
            });
        };

        /**
         * @description Get incoming department inbox items from self.incomingDepartmentInboxes if found and if not load it from server again.
         * @returns {Promise|incomingDepartmentInboxes}
         */
        self.getIncomingDepartmentInboxes = function () {
            return self.incomingDepartmentInboxes.length ? $q.when(self.incomingDepartmentInboxes) : self.loadIncomingDepartmentInboxes();
        };

        /**
         * @description Contains methods for CRUD operations for incoming department inbox items
         */
        self.controllerMethod = {
            incomingDepartmentInboxReturn: function(incomingDepartmentInbox, $event){
                return self.returnIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function(result){
                        toast.success(langService.get("return_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return true;
                    });
            },
            /**
             * @description Return bulk returned department incoming items
             * @param incomingDepartmentInboxes
             * @param $event
             */
            incomingDepartmentInboxesReturnBulk: function (incomingDepartmentInboxes, $event) {
                return self.returnBulkIncomingDepartmentInboxes(incomingDepartmentInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === incomingDepartmentInboxes.length) {
                            toast.error(langService.get("failed_return_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('return_success_except_following', _.map(result, function (returnedDepartmentInbox) {
                                return returnedDepartmentInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_return_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            incomingDepartmentInboxReceive: function(incomingDepartmentInbox, $event){
                return self.receiveIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function(result){
                        toast.success(langService.get("receive_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return true;
                    });
            },
            incomingDepartmentInboxQuickReceive: function(incomingDepartmentInbox, $event){
                return self.quickReceiveIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function(result){
                        toast.success(langService.get("quick_receive_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return true;
                    });
            }
        };


        /**
         * @description Get incoming department inbox item by incomingDepartmentInboxId
         * @param incomingDepartmentInboxId
         * @returns {IncomingDepartmentInbox|undefined} return IncomingDepartmentInbox Model or undefined if not found.
         */
        self.getIncomingDepartmentInboxById = function (incomingDepartmentInboxId) {
            incomingDepartmentInboxId = incomingDepartmentInboxId instanceof IncomingDepartmentInbox ? incomingDepartmentInboxId.id : incomingDepartmentInboxId;
            return _.find(self.incomingDepartmentInboxes, function (incomingDepartmentInbox) {
                return Number(incomingDepartmentInbox.id) === Number(incomingDepartmentInboxId);
            });
        };


        /**
         * @description Return grid action
         * @param incomingDepartmentInbox
         */
        self.returnIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            var vsId = incomingDepartmentInbox.generalStepElm.vsId;
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put(urlService.departmentInboxes+'/'+vsId+'/return/'+workObjectNumber)
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Return bulk incoming department inbox items
         * @param incomingDepartmentInboxes
         */
        self.returnBulkIncomingDepartmentInboxes = function (incomingDepartmentInboxes) {
            var pairToReturn = _.map(incomingDepartmentInboxes, function (incomingDepartmentInbox) {
                return {
                    first: incomingDepartmentInbox.hasOwnProperty('generalStepElm')
                        ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? incomingDepartmentInbox.generalStepElm.vsId : incomingDepartmentInbox.generalStepElm) : (incomingDepartmentInbox.hasOwnProperty('vsId') ? incomingDepartmentInbox.vsId : incomingDepartmentInbox),
                    second: incomingDepartmentInbox.hasOwnProperty('generalStepElm')
                        ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? incomingDepartmentInbox.generalStepElm.workObjectNumber : incomingDepartmentInbox.generalStepElm)
                        : (incomingDepartmentInbox.hasOwnProperty('workObjectNumber') ? incomingDepartmentInbox.workObjectNumber : incomingDepartmentInbox),

                }
            });
            return $http
                .put(urlService.departmentInboxes + '/return/bulk', pairToReturn)
                .then(function (result) {
                    result = result.data.rs;
                    var failedIncomingDepartmentInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedIncomingDepartmentInboxes.push(key);
                    });
                    return _.filter(pairToReturn, function (pair) {
                        return (failedIncomingDepartmentInboxes.indexOf(pair.second) > -1);
                    });
                });
        };

        /**
         * @description Receive grid action
         * @param incomingDepartmentInbox
         */
        self.receiveIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            //var vsId = incomingDepartmentInbox.generalStepElm.vsId;
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put(urlService.departmentInboxes+'/'+workObjectNumber+'/receive')
                .then(function (result) {
                    return result;
                });
        };


        /**
         * @description quick receive grid action
         * @param incomingDepartmentInbox
         */
        self.quickReceiveIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put((urlService.departmentInboxes + '/'+workObjectNumber+'/'+'receive-quick'))
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteIncomingDepartmentInbox, self.updateIncomingDepartmentInbox);
    });
};
