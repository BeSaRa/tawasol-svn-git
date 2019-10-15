module.exports = function (app) {
    app.controller('referencePlanItemPopCtrl', function (dialog,
                                                         referencePlanNumber,
                                                         documentTypeService,
                                                         validationService,
                                                         Lookup,
                                                         _,
                                                         langService,
                                                         DocumentType,
                                                         generator,
                                                         referencePlanItem,
                                                         lookupService,
                                                         ReferencePlanItem) {
        'ngInject';
        var self = this;
        self.controllerName = 'referencePlanItemPopCtrl';
        // current reference plan Number.
        self.referencePlanNumber = referencePlanNumber;
        // the current model for reference plan Item
        self.model = referencePlanItem ? referencePlanItem : new ReferencePlanItem();
        // reference plan Item
        self.referencePlanItem = angular.copy(self.model);
        // check edit mode
        self.editMode = !!referencePlanItem;
        // all document Classes
        self.documentClasses = angular.copy(lookupService.returnLookups(lookupService.documentClass));
        // all security levels
        self.securityLevels = angular.copy(lookupService.returnLookups(lookupService.securityLevel));
        // all document Types
        self.documentTypes = angular.copy(documentTypeService.documentTypes);

        self.referencePlanItemPerOU = self.model.perOu;

        var lookup = new Lookup({
            defaultArName: langService.getKey('all', 'ar'),
            defaultEnName: langService.getKey('all', 'en'),
            lookupKey: null,
            lookupStrKey: ''
        });

        self.documentTypes.unshift(
            new DocumentType({
                arName: langService.getKey('all', 'ar'),
                enName: langService.getKey('all', 'en')
            })
        );

        self.securityLevels.unshift(lookup);
        self.documentClasses.unshift(lookup);

        self.documentClasses = _.map(self.documentClasses, function (item) {
            item.customLookupKey = generator.ucFirst(item.lookupStrKey);
            return item;
        });

        /**
         * @description save reference plan Item
         */
        self.saveReferencePlanItem = function () {
            self.referencePlanItem.retrieveItemComponent();
            return validationService
                .createValidation('CHECK_REFERENCE_PLAN_ITEM')
                // to check if at least has one reference planItem not Separator.
                .addStep('check_format', true, self.referencePlanItem, function (result) {
                    return result.hasFormat();
                })
                .notifyFailure(function () {
                    dialog.errorMessage(langService.get('please_select_reference_format'));
                })
                .addStep('check_duplicate', true, self.referencePlanNumber, function (result) {
                    return !result.hasDuplicatedItem(self.referencePlanItem, self.editMode);
                })
                .notifyFailure(function () {
                    dialog.errorMessage(langService.get('reference_plan_item_duplicated'));
                })
                .addStep('check_serial_required', true, self.referencePlanItem, function (result) {
                    return result.hasSerialComponent();
                })
                .notifyFailure(function () {
                    dialog.errorMessage(langService.get('serial_required_to_save_reference_item'));
                })
                .validate()
                .then(function () {
                    dialog.hide(self.referencePlanItem);
                })
                .catch(function () {

                });

        };
        /**
         * @description close reference plan Item
         */
        self.closeReferencePlanItem = function () {
            dialog.cancel();
        };
        /**
         * @description to check the perOU or Entity
         */
        self.changePerEntityOu = function () {
            self.referencePlanItem.setPerOU(self.referencePlanItemPerOU);
        }

    });
};
