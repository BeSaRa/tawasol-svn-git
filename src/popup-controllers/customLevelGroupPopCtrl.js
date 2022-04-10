module.exports = function (app) {
    app.controller('customLevelGroupPopCtrl', function (customLevelGroupService,
                                                        _,
                                                        editMode,
                                                        toast,
                                                        CustomLevelGroup,
                                                        lookupService,
                                                        validationService,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        customValidationService,
                                                        employeeService,
                                                        readOnlyLevels,
                                                        customLevelGroup) {
        'ngInject';
        var self = this;
        self.controllerName = 'customLevelGroupPopCtrl';
        self.editMode = editMode;
        self.customLevelGroup = angular.copy(customLevelGroup);
        self.readOnlyLevels = readOnlyLevels;
        self.model = angular.copy(customLevelGroup);

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            levels: 'department_level_ids'
        };

        /**
         * @description Add new custom level group
         */
        self.addCustomLevelGroupFromCtrl = function () {
            validationService
                .createValidation('ADD_CUSTOM_LEVEL_GROUP')
                .addStep('check_required', true, generator.checkRequiredFields, self.customLevelGroup, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('validate_levels_number_only', true, customValidationService.validateInputArray, [self.customLevelGroup.levels, "number"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('numberonly', [self.validateLabels['levels']]);
                })
                .addStep('validate_level_employee_ou_id', true, self.validateLevelWithCurrentOuId, null, function (result) {
                    return result;
                })
                .notifyFailure(function () {
                    toast.error(langService.get('level_can_not_be_current_ou_id'));
                })
                .validate()
                .then(function () {
                    customLevelGroupService
                        .addCustomLevelGroup(self.customLevelGroup)
                        .then(function () {
                            dialog.hide(self.customLevelGroup);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit custom level group
         */
        self.editCustomLevelGroupFromCtrl = function () {
            validationService
                .createValidation('EDIT_CUSTOM_LEVEL_GROUP')
                .addStep('check_required', true, generator.checkRequiredFields, self.customLevelGroup, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('validate_levels_number_only', true, customValidationService.validateInputArray, [self.customLevelGroup.levels, "number"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('numberonly', [self.validateLabels['levels']]);
                })
                .addStep('validate_level_employee_ou_id', true, self.validateLevelWithCurrentOuId, null, function (result) {
                    return result;
                })
                .notifyFailure(function () {
                    toast.error(langService.get('level_can_not_be_current_ou_id'));
                })
                .validate()
                .then(function () {
                    customLevelGroupService
                        .updateCustomLevelGroup(self.customLevelGroup)
                        .then(function () {
                            dialog.hide(self.customLevelGroup);
                        });
                })
                .catch(function () {

                });
        };

        self.validateLevelWithCurrentOuId = function () {
            return _.every(self.customLevelGroup.levels, (id) => {
                return employeeService.getEmployee().getOUID() !== Number(id);
            })
        }


        /**
         * @description Close the popup
         */
        self.close = function () {
            dialog.cancel();
        }
    });
};