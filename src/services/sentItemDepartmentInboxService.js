module.exports = function (app) {
    app.service('sentItemDepartmentInboxService', function (urlService,
                                                            $http,
                                                            $q,
                                                            generator,
                                                            SentItemDepartmentInbox,
                                                            _,
                                                            dialog,
                                                            langService,
                                                            toast,
                                                            cmsTemplate,
                                                            tokenService,
                                                            $timeout) {
        'ngInject';
        var self = this;
        self.serviceName = 'sentItemDepartmentInboxService';

        self.sentItemDepartmentInboxes = [];

        /**
         * @description Load the sent items from server.
         * @returns {Promise|sentItemDepartmentInboxes}
         */
        self.loadSentItemDepartmentInboxes = function (month, year) {
            /*
            * Pending(0),Sent(1),Delivered(2),Returned(3),Removed(4)
            * */
            return $http.post(urlService.departmentInboxes + '/dept-sent-items/month/' + month + '/year/' + year, [0,1]).then(function (result) {
                self.sentItemDepartmentInboxes = generator.generateCollection(result.data.rs, SentItemDepartmentInbox, self._sharedMethods);
                self.sentItemDepartmentInboxes = generator.interceptReceivedCollection('SentItemDepartmentInbox', self.sentItemDepartmentInboxes);
                return self.sentItemDepartmentInboxes;
            });
        };

        /**
         * @description Get sent items from self.sentItemDepartmentInboxes if found and if not load it from server again.
         * @returns {Promise|sentItemDepartmentInboxes}
         */
        self.getSentItemDepartmentInboxes = function (month, year) {
            return self.sentItemDepartmentInboxes.length ? $q.when(self.sentItemDepartmentInboxes) : self.loadSentItemDepartmentInboxes(month, year);
        };

        /**
         * @description Contains methods for CRUD operations for sent items
         */
        self.controllerMethod = {
            /**
             * @description Opens the dialog to select the month and ab year to get the data in the grid
             * @param currentMonth
             * @param currentYear
             * @param $event
             */
            openDateAndYearDialog: function (currentMonth, currentYear, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('department-inbox-sent-item'),
                        controller: 'departmentInboxSentItemPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            currentMonth: currentMonth,
                            currentYear: currentYear
                        }
                    });
            },
            /**
             * @description Terminate user inbox
             * @param sentItemDepartmentInbox
             * @param $event
             */
            sentItemDepartmentInboxTerminate: function (sentItemDepartmentInbox, $event) {
                return self.terminateSentItemDepartmentInbox(sentItemDepartmentInbox)
                    .then(function (result) {
                        return true;
                    })
            }
        };

        /**
         * @description Terminate user inbox item
         * @param {WorkItem} sentItemDepartmentInbox
         */
        self.terminateSentItemDepartmentInbox = function (sentItemDepartmentInbox) {
            var won = sentItemDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (sentItemDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? sentItemDepartmentInbox.generalStepElm.workObjectNumber : sentItemDepartmentInbox.generalStepElm)
                : (sentItemDepartmentInbox.hasOwnProperty('workObjectNumber') ? sentItemDepartmentInbox.workObjectNumber : sentItemDepartmentInbox);
            /* var wfName = sentItemDepartmentInbox.hasOwnProperty('generalStepElm')
                 ? (sentItemDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? sentItemDepartmentInbox.generalStepElm.workFlowName : sentItemDepartmentInbox.generalStepElm)
                 : (sentItemDepartmentInbox.hasOwnProperty('workFlowName') ? sentItemDepartmentInbox.workFlowName : sentItemDepartmentInbox);*/

            var wfName = "outgoing";

            return $http
                .put(urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/" + won)
                .then(function (result) {
                    return sentItemDepartmentInbox;
                });
        };

        /**
         * @description Get sent item by sentItemDepartmentInboxId
         * @param sentItemDepartmentInboxId
         * @returns {SentItemDepartmentInbox|undefined} return SentItemDepartmentInbox Model or undefined if not found.
         */
        self.getSentItemDepartmentInboxById = function (sentItemDepartmentInboxId) {
            sentItemDepartmentInboxId = sentItemDepartmentInboxId instanceof SentItemDepartmentInbox ? sentItemDepartmentInboxId.id : sentItemDepartmentInboxId;
            return _.find(self.sentItemDepartmentInboxes, function (sentItemDepartmentInbox) {
                return Number(sentItemDepartmentInbox.id) === Number(sentItemDepartmentInboxId);
            });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param sentItemDepartmentInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateSentItemDepartmentInbox = function (sentItemDepartmentInbox, editMode) {
            var sentItemDepartmentInboxesToFilter = self.sentItemDepartmentInboxes;
            if (editMode) {
                sentItemDepartmentInboxesToFilter = _.filter(sentItemDepartmentInboxesToFilter, function (sentItemDepartmentInboxToFilter) {
                    return sentItemDepartmentInboxToFilter.id !== sentItemDepartmentInbox.id;
                });
            }
            return _.some(_.map(sentItemDepartmentInboxesToFilter, function (existingSentItemDepartmentInbox) {
                return existingSentItemDepartmentInbox.arName === sentItemDepartmentInbox.arName
                    || existingSentItemDepartmentInbox.enName.toLowerCase() === sentItemDepartmentInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSentItemDepartmentInbox, self.updateSentItemDepartmentInbox);
    });
};
