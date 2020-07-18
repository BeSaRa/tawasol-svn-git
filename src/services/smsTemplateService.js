module.exports = function (app) {
    app.service('smsTemplateService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                SmsTemplate,
                                                _,
                                                dialog,
                                                langService,
                                                toast,
                                                cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'smsTemplateService';

        self.smsTemplates = [];

        /**
         * @description load sms templates from server.
         * @returns {Promise|smsTemplates}
         */
        self.loadSmsTemplates = function () {
            return $http.get(urlService.smsTemplates).then(function (result) {
                self.smsTemplates = generator.generateCollection(result.data.rs, SmsTemplate, self._sharedMethods);
                self.smsTemplates = generator.interceptReceivedCollection('SmsTemplate', self.smsTemplates);
                return self.smsTemplates;
            });
        };

        /**
         * @description get sms templates from self.smsTemplates if found and if not load it from server again.
         * @returns {Promise|smsTemplates}
         */
        self.getSmsTemplates = function () {
            return self.smsTemplates.length ? $q.when(self.smsTemplates) : self.loadSmsTemplates();
        };


        /**
         * @description load sms templates from server.
         * @returns {Promise|smsTemplates}
         */
        self.loadActiveSmsTemplates = function (skipInterceptReceive) {
            return $http.get(urlService.smsTemplates + '/active').then(function (result) {
                self.smsTemplates = generator.generateCollection(result.data.rs, SmsTemplate, self._sharedMethods);
                if (!skipInterceptReceive) {
                    self.smsTemplates = generator.interceptReceivedCollection('SmsTemplate', self.smsTemplates);
                }
                return self.smsTemplates;
            });
        };

        /**
         * @description Contains methods for CRUD operations for sms templates
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new sms template
             * @param $event
             */
            smsTemplateAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sms-template'),
                        controller: 'smsTemplatePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            smsTemplate: new SmsTemplate(),
                            smsTemplates: self.smsTemplates
                        }
                    });
            },
            /**
             * @description Opens popup to edit sms template
             * @param smsTemplate
             * @param $event
             */
            smsTemplateEdit: function (smsTemplate, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sms-template'),
                        controller: 'smsTemplatePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            smsTemplate: smsTemplate,
                            smsTemplates: self.smsTemplates
                        }
                    });
            },
            /**
             * @description Show confirm box and delete sms template
             * @param smsTemplate
             * @param $event
             */
            smsTemplateDelete: function (smsTemplate, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: smsTemplate.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteSmsTemplate(smsTemplate).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: smsTemplate.getNames()}));
                            return true;
                        });
                    });
            },
            /**
             * @description Show confirm box and delete bulk sms templates
             * @param smsTemplates
             * @param $event
             */
            smsTemplateDeleteBulk: function (smsTemplates, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkSmsTemplates(smsTemplates)
                            .then(function (result) {
                                var response = false;
                                if (result.length === smsTemplates.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (smsTemplate) {
                                        return smsTemplate.getNames();
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
            openManageSubscribersDialog: function (smsTemplate, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('relation-app-user'),
                        controller: 'relationAppUserPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            label: 'manage_sms_template_subscribers',
                            record: angular.copy(smsTemplate),
                            propertyToSetValue: 'smstemplateSubscribers',
                            updateMethod: self.updateSmsTemplate
                        }
                    });
            },
            openSMSTemplateBodyDialog: function (smsTemplate, $event) {
                dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('message-body'),
                    bindToController: true,
                    escToCancel: true,
                    targetEvent: $event,
                    controllerAs: 'ctrl',
                    controller: 'messageBodyPopCtrl',
                    locals: {
                        label: 'sms_message',
                        record: smsTemplate,
                        isHtml: true,
                        bodyProperty: {arabic: 'arMessage', english: 'enMessage'}
                    }
                });
            }
        };

        /**
         * @description Add new sms template
         * @param smsTemplate
         * @return {Promise|SmsTemplate}
         */
        self.addSmsTemplate = function (smsTemplate) {
            return $http
                .post(urlService.smsTemplates,
                    generator.interceptSendInstance('SmsTemplate', smsTemplate))
                .then(function (result) {
                    smsTemplate.id = result.data.rs;
                    return smsTemplate;
                });
        };

        /**
         * @description Update the given sms template.
         * @param smsTemplate
         * @return {Promise|SmsTemplate}
         */
        self.updateSmsTemplate = function (smsTemplate) {
            return $http
                .put(urlService.smsTemplates,
                    generator.interceptSendInstance('SmsTemplate', smsTemplate))
                .then(function () {
                    return smsTemplate;
                });
        };

        /**
         * @description Delete given sms template.
         * @param smsTemplate
         * @return {Promise|null}
         */
        self.deleteSmsTemplate = function (smsTemplate) {
            var id = smsTemplate.hasOwnProperty('id') ? smsTemplate.id : smsTemplate;
            return $http.delete((urlService.smsTemplates + '/' + id));
        };

        /**
         * @description Delete bulk sms templates.
         * @param smsTemplates
         * @return {Promise|null}
         */
        self.deleteBulkSmsTemplates = function (smsTemplates) {
            var bulkIds = smsTemplates[0].hasOwnProperty('id') ? _.map(smsTemplates, 'id') : smsTemplates;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.smsTemplates + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedSmsTemplates = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedSmsTemplates.push(key);
                });
                return _.filter(smsTemplates, function (smsTemplate) {
                    return (failedSmsTemplates.indexOf(smsTemplate.id) > -1);
                });
            });
        };

        /**
         * @description Get sms template by smsTemplateId
         * @param smsTemplateId
         * @returns {SmsTemplate|undefined} return SmsTemplate Model or undefined if not found.
         */
        self.getSmsTemplateById = function (smsTemplateId) {
            smsTemplateId = smsTemplateId instanceof SmsTemplate ? smsTemplateId.id : smsTemplateId;
            return _.find(self.smsTemplates, function (smsTemplate) {
                return Number(smsTemplate.id) === Number(smsTemplateId)
            });
        };

        /**
         * @description Activate sms template
         * @param smsTemplate
         */
        self.activateSmsTemplate = function (smsTemplate) {
            return $http
                .put((urlService.smsTemplates + '/activate/' + smsTemplate.id))
                .then(function () {
                    return smsTemplate;
                });
        };

        /**
         * @description Deactivate sms template
         * @param smsTemplate
         */
        self.deactivateSmsTemplate = function (smsTemplate) {
            return $http
                .put((urlService.smsTemplates + '/deactivate/' + smsTemplate.id))
                .then(function () {
                    return smsTemplate;
                });
        };

        /**
         * @description Activate bulk of sms templates
         * @param smsTemplates
         */
        self.activateBulkSmsTemplates = function (smsTemplates) {
            var bulkIds = smsTemplates[0].hasOwnProperty('id') ? _.map(smsTemplates, 'id') : smsTemplates;
            return $http
                .put((urlService.smsTemplates + '/activate/bulk'), bulkIds)
                .then(function () {
                    return smsTemplates;
                });
        };

        /**
         * @description Deactivate bulk of sms templates
         * @param smsTemplates
         */
        self.deactivateBulkSmsTemplates = function (smsTemplates) {
            var bulkIds = smsTemplates[0].hasOwnProperty('id') ? _.map(smsTemplates, 'id') : smsTemplates;
            return $http
                .put((urlService.smsTemplates + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return smsTemplates;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param smsTemplate
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateSmsTemplate = function (smsTemplate, editMode) {
            var smsTemplatesToFilter = self.smsTemplates;
            if (editMode) {
                smsTemplatesToFilter = _.filter(smsTemplatesToFilter, function (smsTemplateToFilter) {
                    return smsTemplateToFilter.id !== smsTemplate.id;
                });
            }
            return _.some(_.map(smsTemplatesToFilter, function (existingSmsTemplate) {
                return existingSmsTemplate.arName === smsTemplate.arName
                    || existingSmsTemplate.enName.toLowerCase() === smsTemplate.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSmsTemplate, self.updateSmsTemplate);
    });
};
