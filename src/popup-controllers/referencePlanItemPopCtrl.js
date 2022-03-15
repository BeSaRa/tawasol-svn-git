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
                                                         ReferencePlanItem,
                                                         referencePlanItems,
                                                         siteTypes,
                                                         correspondenceService,
                                                         classificationService,
                                                         $timeout,
                                                         mainClassifications,
                                                         CorrespondenceSiteType) {
        'ngInject';
        var self = this;
        self.controllerName = 'referencePlanItemPopCtrl';
        // current reference plan Number.
        self.referencePlanNumber = referencePlanNumber;
        // list of reference plan number items
        self.referencePlanItems = referencePlanItems;
        // the current model for reference plan Item
        self.model = referencePlanItem;
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
        // all correspondence site types
        self.correspondenceSiteTypes = angular.copy(siteTypes);

        self.referencePlanItemPerOU = self.model.perOu;
        self.mainClassificationSearchText = '';
        self.previousMainClassifications = [];
        self.previousSubClassifications = [];

        self.mainClassifications = getClassificationsByDocumentClass(mainClassifications);
        self.mainClassificationsCopy = angular.copy(mainClassifications);

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

        self.correspondenceSiteTypes.unshift(
            new CorrespondenceSiteType({
                arName: langService.getKey('all', 'ar'),
                enName: langService.getKey('all', 'en')
            })
        );

        self.documentClasses = _.map(self.documentClasses, function (item) {
            item.customLookupKey = generator.ucFirst(item.lookupStrKey.toLowerCase());
            return item;
        });

        /**
         * @description save reference plan Item
         */
        self.saveReferencePlanItem = function () {
            self.referencePlanItem.retrieveItemComponent();
            return validationService
                .createValidation('CHECK_REFERENCE_PLAN_ITEM')
                .addStep('check_static_text_required', true, self.referencePlanItem, function (result) {
                    return !result.hasEmptyReferenceFormat();
                })
                .notifyFailure(function () {
                    dialog.errorMessage(langService.get('static_text_required_to_save_reference_item'));
                })
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
                .addStep('CHECK_ITEM_ORDER', true, self.referencePlanItem, function (item) {
                    return !_.some(self.referencePlanNumber.referencePlanItems, function (refItem) {
                        return refItem.itemOrder && refItem.itemOrder === item.itemOrder && refItem.id !== item.id;
                    });
                })
                .notifyFailure(function () {
                    dialog.errorMessage(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    dialog.hide(self.referencePlanItem);
                })
                .catch(function () {

                });

        };

        /**
         * @description load Main depend on criteria ... used to load more if the current mainClassifications dose not have what the user searched for.
         * @param $event
         */
        self.loadMainClassificationByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            // to reserve old sub sites
            if (self.mainClassifications.length)
                self.previousMainClassifications = angular.copy(self.mainClassifications);

            classificationService.classificationSearch(self.mainClassificationSearchText, undefined, true)
                .then(function (classifications) {
                    self.mainClassifications = getClassificationsByDocumentClass(classifications);
                    // self.mainClassificationsCopy = angular.copy(classifications);
                });
        };

        function getClassificationsByDocumentClass(classifications) {
            classifications = classifications || self.mainClassificationsCopy;
            if (self.referencePlanItem.expressionComponents.classDescription === null || self.referencePlanItem.expressionComponents.classDescription === 'undefined') {
                return classifications;
            }

            return classifications.filter(function (classification) {
                return classification.docClassId !== null && generator.getDocumentClassName(classification.docClassId).toLowerCase() === self.referencePlanItem.expressionComponents.classDescription.toLowerCase()
            });
        }

        self.onChangeDocumentClass = function () {
            self.referencePlanItem.expressionComponents.mainClassification = null;
            self.mainClassifications = getClassificationsByDocumentClass();
        }

        self.setPropertiesSpaceBackIfNoLength = function ($event, text, callback) {
            var key = $event.keyCode || $event.which;
            if (!text.length && key === 8) {
                callback();
            }
        };
        /**
         * @description set previousMainClassifications in case if it has length
         */
        self.setOldMainClassification = function () {
            self.previousMainClassifications.length && !self.mainClassifications.length ? self.mainClassifications = self.previousMainClassifications : null;
            self.previousMainClassifications = [];
        };
        /**
         * capture any event except arrows UP/DOWN allow those.
         * @param $event
         * @param enterCallback
         */
        self.allowPropagationUpDownArrows = function ($event, enterCallback) {
            var key = $event.keyCode || $event.which;
            if (key === 13 && enterCallback) {
                enterCallback($event);
                $event.stopPropagation();
            }
            var allowedKeys = [38 /* UP */, 40 /* DOWN */];
            allowedKeys.indexOf(key) === -1 ? $event.stopPropagation() : null;
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
