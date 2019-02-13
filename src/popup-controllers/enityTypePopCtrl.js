module.exports = function (app) {
    app.controller('entityTypePopCtrl', function (lookupService,
                                                  entityTypeService,
                                                  EntityType,
                                                  $q,
                                                  langService,
                                                  toast,
                                                  dialog,
                                                  editMode,
                                                  entityType,
                                                  validationService,
                                                  generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'entityTypePopCtrl';
        self.editMode = editMode;
        self.entityType = entityType;
        self.model = angular.copy(self.entityType);
        self.lookupStrKey = angular.copy(self.entityType.lookupStrKey);
        /**
         *@description All s
         */
        self.jobTitlePops = entityType;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            itemOrder: 'item_order'
        };
        self.promise = null;
        self.selecteds = [];
        self.addEntityTypeFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.entityType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, entityTypeService.checkDuplicateEntityType, [self.entityType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .validate()
                .then(function () {
                    entityTypeService.addEntityType(self.entityType).then(function () {
                        dialog.hide(self.entityType);
                    });
                })
                .catch(function () {

                })

        };
        /**
         *
         */
        self.editEntityTypeFromCtrl = function () {
           // self.entityType.lookupStrKey = self.lookupStrKey;
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.entityType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, entityTypeService.checkDuplicateEntityType, [self.entityType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .validate()
                .then(function () {
                    entityTypeService.updateEntityType(entityType).then(function () {
                       dialog.hide(self.entityType);
                    });
                })
                .catch(function () {
                })
        };

        /**
         * @description Reset the form
         * @param form
         * @param $event
         */
        self.resetModel = function(form, $event){
            generator.resetFields(self.entityType, self.model);
            form.$setUntouched();
        };

        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        };
    });
};