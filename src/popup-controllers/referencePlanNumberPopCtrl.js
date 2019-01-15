module.exports = function (app) {
    app.controller('referencePlanNumberPopCtrl', function (referencePlanNumberService,
                                                           _,
                                                           editMode,
                                                           toast,
                                                           ReferencePlanNumber,
                                                           validationService,
                                                           cmsTemplate,
                                                           generator,
                                                           dialog,
                                                           langService,
                                                           referencePlanNumber) {
        'ngInject';
        var self = this;
        self.controllerName = 'referencePlanNumberPopCtrl';
        self.editMode = editMode;

        self.referencePlanNumber = angular.copy(referencePlanNumber);
        self.model = angular.copy(referencePlanNumber);
        self.hasResetDate = editMode ? (self.model.resetDay > 0) : false;
        self.resetDisabled = !self.hasResetDate;
        self.days = _.range(1, 32);
        self.months = _.range(1, 13);

        self.referencePlanItem = null;


        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            description: 'description',
            isGlobal: 'global',
            resetMonth: 'reset_month',
            resetDay: 'reset_day'
        };

        /**
         * @description Add new reference plan number
         */
        self.addReferencePlanNumberFromCtrl = function () {
            if (!self.hasResetDate) {
                self.referencePlanNumber.resetDay = 0;
                self.referencePlanNumber.resetMonth = 0;
            }

            validationService
                .createValidation('ADD_REFERENCE_PLAN_NUMBER')
                .addStep('check_required', true, generator.checkRequiredFields, self.referencePlanNumber, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, referencePlanNumberService.checkDuplicateReferencePlanNumber, [self.referencePlanNumber, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_is_reference_valid', true, function () {
                    return self.referencePlanNumber.isValidReferencePlan();
                }, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    return dialog.errorMessage(langService.get('invalid_reference_plan_has_not_all_item'))
                })
                .validate()
                .then(function () {
                    referencePlanNumberService
                        .addReferencePlanNumber(self.referencePlanNumber)
                        .then(function () {
                            dialog.hide(self.referencePlanNumber);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit reference plan number
         */
        self.editReferencePlanNumberFromCtrl = function () {
            if (!self.hasResetDate) {
                self.referencePlanNumber.resetDay = 0;
                self.referencePlanNumber.resetMonth = 0;
            }
            validationService
                .createValidation('EDIT_REFERENCE_PLAN_NUMBER')
                .addStep('check_required', true, generator.checkRequiredFields, self.referencePlanNumber, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {

                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, referencePlanNumberService.checkDuplicateReferencePlanNumber, [self.referencePlanNumber, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_is_reference_valid', true, function () {
                    return self.referencePlanNumber.isValidReferencePlan();
                }, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    return dialog.errorMessage(langService.get('invalid_reference_plan_has_not_all_item'))
                })
                .validate()
                .then(function () {
                    referencePlanNumberService
                        .updateReferencePlanNumber(self.referencePlanNumber)
                        .then(function () {
                            dialog.hide(self.referencePlanNumber);
                        });
                })
                .catch(function (errors) {
                });
        };

        self.resetDayAndMonth = function () {
            if (!self.hasResetDate) {
                self.referencePlanNumber.resetDay = null;
                self.referencePlanNumber.resetMonth = null;
                self.resetDisabled = true;
            }
            else {
                self.resetDisabled = false;
            }
        };

        /**
         * @description Close the popup
         */
        self.closeReferencePlanNumberPopupFromCtrl = function () {
            dialog.cancel();
        };
        /**
         * delete reference plan item
         */
        self.deleteReferenceItem = function (referenceItem, index) {
            return dialog
                .confirmMessage(langService.get('confirm_delete').change({name: langService.get('the_element')}))
                .then(function () {
                    self.referencePlanNumber.referencePlanItems.splice(index, 1);
                });
        };
        /**
         * edit reference plan item
         * @param referenceItem
         * @param index
         */
        self.editReferenceItem = function (referenceItem, index) {
            self.referencePlanItem = referenceItem;
            self.referencePlanItemIndex = index;
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reference-plan-item'),
                    controller: 'referencePlanItemPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        referencePlanNumber: referencePlanNumber,
                        referencePlanItem: referenceItem
                    },
                    resolve: {
                        documentTypes: function (documentTypeService) {
                            'ngInject';
                            return documentTypeService.getDocumentTypes();
                        }
                    }
                })
                .then(function (referencePlanItem) {
                    self.referencePlanNumber.referencePlanItems.splice(self.referencePlanItemIndex, 1, referencePlanItem);
                });
        };

        self.addReferencePlanItem = function () {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reference-plan-item'),
                    controller: 'referencePlanItemPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        referencePlanNumber: referencePlanNumber,
                        referencePlanItem: false
                    },
                    resolve: {
                        documentTypes: function (documentTypeService) {
                            'ngInject';
                            return documentTypeService.getDocumentTypes();
                        }
                    }
                })
                .then(function (referencePlanItem) {
                    self.referencePlanNumber.referencePlanItems.push(referencePlanItem);
                });
        };


    });
};
