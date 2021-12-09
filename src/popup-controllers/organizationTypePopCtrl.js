module.exports = function (app) {
    app.controller('organizationTypePopCtrl', function (organizationType,
                                                        editMode,
                                                        generator,
                                                        langService,
                                                        validationService,
                                                        organizationTypeService,
                                                        dialog,
                                                        toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationTypePopCtrl';

        self.editMode = editMode;
        self.organizationType = angular.copy(organizationType);
        self.model = angular.copy(organizationType);

        self.organizationTypes = organizationTypeService.organizationTypes;

        /**
         * @description Add new organization type
         */
        self.addOrganizationTypeFromCtrl = function () {
            validationService
                .createValidation('ADD_ORGANIZATION_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.organizationType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, organizationTypeService.checkDuplicateOrganizationType, [self.organizationType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.organizationType, self.organizationTypes, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    organizationTypeService
                        .addOrganizationType(self.organizationType)
                        .then(function (organizationType) {
                            dialog.hide(organizationType);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit organization type
         */
        self.editOrganizationTypeFromCtrl = function () {
            validationService
                .createValidation('EDIT_ORGANIZATION_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.organizationType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, organizationTypeService.checkDuplicateOrganizationType, [self.organizationType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.organizationType, self.organizationTypes, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    organizationTypeService
                        .updateOrganizationType(self.organizationType)
                        .then(function () {
                            dialog.hide(self.organizationType);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * Close the popup
         */
        self.closeOrganizationTypePopupFromCtrl = function () {
            dialog.cancel();
        };

        self.resetModel = function () {
            generator.resetFields(self.organizationType, self.model);
        };

    });
};
