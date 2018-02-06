module.exports = function (app) {
    app.controller('smsTemplateCtrl', function (lookupService,
                                                smsTemplateService,
                                                applicationUserService,
                                                smsTemplates,
                                                $q,
                                                langService,
                                                $scope,
                                                toast,
                                                contextHelpService,
                                                dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'smsTemplateCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('sms-templates');

        $scope.smsVariables = [
            'DocumentFile',
            'DocumentType',
            'EntityName',
            'OrganizationName'
        ];

        /**
         * @description All sms templates
         * @type {*}
         */
        self.smsTemplates = smsTemplates;

        /**
         * @description Contains the selected sms templates
         * @type {Array}
         */
        self.selectedSmsTemplates = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.smsTemplates.length + 21)
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for sms templates
         */
        self.statusServices = {
            'activate': smsTemplateService.activateBulkSmsTemplates,
            'deactivate': smsTemplateService.deactivateBulkSmsTemplates,
            'true': smsTemplateService.activateSmsTemplate,
            'false': smsTemplateService.deactivateSmsTemplate
        };

        /**
         * @description Opens dialog for add new sms template
         * @param $event
         */
        self.openAddSmsTemplateDialog = function ($event) {
            smsTemplateService
                .controllerMethod
                .smsTemplateAdd($event)
                .then(function (result) {
                    self.reloadSmsTemplates(self.grid.page)
                        /*.then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });*/
                });
        };

        /**
         * @description Opens dialog for edit sms template
         * @param $event
         * @param smsTemplate
         */
        self.openEditSmsTemplateDialog = function (smsTemplate, $event) {
            smsTemplateService
                .controllerMethod
                .smsTemplateEdit(smsTemplate, $event)
                .then(function (result) {
                    self.reloadSmsTemplates(self.grid.page)
                        /*.then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });*/
                });
        };

        self.showSmsTemplateContent = function(smsTemplate , $event){
            dialog
                .successMessage(smsTemplate.message, null, null, $event, true);
        };

        /**
         * @description Reload the grid of sms template
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSmsTemplates = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return smsTemplateService
                .loadSmsTemplates()
                .then(function (result) {
                    self.smsTemplates = result;
                    self.selectedSmsTemplates = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single sms template
         * @param smsTemplate
         * @param $event
         */
        self.removeSmsTemplate = function (smsTemplate, $event) {
            smsTemplateService
                .controllerMethod
                .smsTemplateDelete(smsTemplate, $event)
                .then(function () {
                    self.reloadSmsTemplates(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected sms templates
         * @param $event
         */
        self.removeBulkSmsTemplates = function ($event) {
            smsTemplateService
                .controllerMethod
                .smsTemplateDeleteBulk(self.selectedSmsTemplates, $event)
                .then(function () {
                    self.reloadSmsTemplates(self.grid.page);
                });
        };

        /**
         * @description Change the status of sms template
         * @param smsTemplate
         */
        self.changeStatusSmsTemplate = function (smsTemplate) {
            self.statusServices[smsTemplate.status](smsTemplate)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    smsTemplate.status = !smsTemplate.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected sms templates
         * @param status
         */
        self.changeStatusBulkSmsTemplates = function (status) {
            self.statusServices[status](self.selectedSmsTemplates)
                .then(function () {
                    self.reloadSmsTemplates(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Change the globalization of sms template
         * @param smsTemplate
         */
        self.changeGlobalSmsTemplate = function (smsTemplate) {
            if (smsTemplate.isGlobal) {
                smsTemplateService.updateSmsTemplate(smsTemplate)
                    .then(function () {
                        toast.success(langService.get('globalization_success'));
                    })
                    .catch(function () {
                        smsTemplate.isGlobal = !smsTemplate.isGlobal;
                        dialog.errorMessage(langService.get('something_happened_when_update_global'));
                    });
            }
            else {
                smsTemplateService
                    .controllerMethod
                    .smsTemplateSetGlobalNo(smsTemplate)
                    .then(function () {
                        return self.reloadSmsTemplates(self.grid.page)
                            .then(function () {
                                toast.success(langService.get('globalization_success'));
                            })
                            .catch(function () {
                                smsTemplate.isGlobal = !smsTemplate.isGlobal;
                                smsTemplate.smstemplateSubscribers = [];
                                dialog.errorMessage(langService.get('something_happened_when_update_global'));
                            });
                    })
                    .catch(function () {
                        smsTemplate.isGlobal = !smsTemplate.isGlobal;
                        smsTemplate.smstemplateSubscribers = [];
                    });
            }
        };

    });
};