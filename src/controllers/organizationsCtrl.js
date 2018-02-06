module.exports = function (app) {
    app.controller('organizationsCtrl', function (organizationService,
                                                  cmsTemplate,
                                                  dialog,
                                                  organizations,
                                                  referencePlanNumberService,
                                                  contextHelpService,
                                                  permissions,
                                                  $window) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationsCtrl';

        self.organizations = organizations;
        contextHelpService.setHelpTo('organizations');

        self.reloadOrganizations = function () {
            return referencePlanNumberService
                .loadReferencePlanNumbers()
                .then(function () {
                    organizationService
                        .loadOrganizations()
                        .then(function (result) {
                            self.organizations = result;
                        });
                })
        };

        self.selectOrganizationToAdd = function () {
            return dialog
                .showDialog({
                    controller: function () {

                    },
                    template: cmsTemplate.getPopup('select-organization')
                })
        };

        self.exportOrganizations = function () {
            organizationService
                .exportOrganizations()
                .then(function (result) {
                    window.open(result.data.rs);
                });
        };

        self.importOrganizations = function ($event) {
            organizationService
                .controllerMethod
                .organizationImport($event)
                .then(function (result) {

                });
        }

    });
};