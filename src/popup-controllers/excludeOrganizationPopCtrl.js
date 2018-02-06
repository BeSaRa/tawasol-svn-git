module.exports = function (app) {
    app.controller('excludeOrganizationPopCtrl', function (subOrganizations,
                                                           organizationsToExclude,
                                                           dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'excludeOrganizationPopCtrl';

        self.subOrganizations = subOrganizations;
        self.organizationsToExclude = organizationsToExclude;

        /**
         * @description Close the popup and return the organizations to exclude
         */
        self.closeExcludeOrganizationPopupFromCtrl = function () {
            dialog.hide(self.organizationsToExclude);
        };

    });
};