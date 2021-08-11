module.exports = function (app) {
    app.factory('WorkflowAction', function (CMSModelInterceptor,
                                            langService,
                                            applicationUserService) {
        'ngInject';
        return function WorkflowAction(model) {
            var self = this, userWorkflowActionService;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.isGlobal = true;
            self.exportable = true;
            self.transferable = true;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'isGlobal',
                'exportable'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            WorkflowAction.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for workflow action. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            WorkflowAction.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            WorkflowAction.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            /**
             * @description Get the translated arabic or english name according to current language for workflow action. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            WorkflowAction.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of workflow action as Active or Inactive instead of true or false.
             * @returns {string}
             */
            WorkflowAction.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of workflow action as Yes or No instead of true or false.
             * @returns {string}
             */
            WorkflowAction.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the exportable of workflow action as Yes or No instead of true or false.
             * @returns {string}
             */
            WorkflowAction.prototype.getTranslatedExportable = function () {
                return this.exportable ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the globalization of DocumentSecurity as Yes or No instead of true or false.
             * @returns {string}
             */
            WorkflowAction.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };


            WorkflowAction.prototype.setUserWorkflowActionService = function (service) {
                userWorkflowActionService = service;
                return this;
            };
            WorkflowAction.prototype.hasUsers = function () {
                return this.relatedUsers.length;
            };
            WorkflowAction.prototype.getRelatedUsers = function () {
                return this.relatedUsers;
            };
            WorkflowAction.prototype.setRelatedUsers = function (relatedUsers) {
                this.relatedUsers = relatedUsers;
                return this;
            };
            WorkflowAction.prototype.setGlobal = function (status) {
                this.isGlobal = status;
                return this;
            };

            WorkflowAction.prototype.deleteAllRelatedUsers = function () {
                var self = this;
                console.log(self);
                return userWorkflowActionService
                    .deleteBulkUserWorkflowActions(this.getRelatedUsers())
                    .then(function () {
                        self.setRelatedUsers([]);
                        self.isGlobal = true;
                        return self;
                    });
            };

            WorkflowAction.prototype.openDialogToSelectUsers = function () {
                var self = this;
                return applicationUserService
                    .controllerMethod
                    .selectApplicationUsers(self.relatedUsers, "workflow_related_users")
                    .then(function (applicationUsers) {
                        return self.addBulkRelatedUsers(applicationUsers);
                    });
            };


            WorkflowAction.prototype.addBulkRelatedUsers = function (applicationUsers) {
                var self = this;
                return userWorkflowActionService
                    .createListUserWorkflowActions(applicationUsers, self, true)
                    .then(function (userWorkflowActions) {
                        return self.relatedUsers = self.relatedUsers.concat(userWorkflowActions);
                    })
            };

            WorkflowAction.prototype.isFavorite = function () {
                return this.hasOwnProperty('checked') && this.checked;
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkflowAction', 'init', this);
        }
    })
};
