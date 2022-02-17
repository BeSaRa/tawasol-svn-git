module.exports = function (app) {
    app.controller('dynamicFollowupPopCtrl', function (lookupService,
                                                       $q,
                                                       langService,
                                                       toast,
                                                       dialog,
                                                       editMode,
                                                       dynamicFollowup,
                                                       Information,
                                                       applicationUsers,
                                                       dynamicFollowupService,
                                                       generator,
                                                       validationService,
                                                       dynamicFollowUps,
                                                       _) {
        'ngInject';
        var self = this;
        self.controllerName = 'dynamicFollowupPopCtrl';
        self.editMode = editMode;

        self.dynamicFollowup = dynamicFollowup;
        self.dynamicFollowupCopy = angular.copy(dynamicFollowup);
        self.applicationUsers = applicationUsers;
        self.dynamicFollowUps = dynamicFollowUps;

        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);

        self.appUserSearchText = '';
        self.lookupNames = {};
        _.map(lookupService.returnLookups(lookupService.inboxFilterKey), function (lookup) {
            self.lookupNames['key_' + lookup.lookupKey] = new Information({
                arName: lookup.defaultArName,
                enName: lookup.defaultEnName,
                id: lookup.lookupKey
            });
            self.lookupNames['key_siteType'] = new Information({
                arName: langService.getByLangKey('correspondence_site_type', 'ar'),
                enName: langService.getByLangKey('correspondence_site_type', 'en')
            });
            self.lookupNames['key_mainSite'] = new Information({
                arName: langService.getByLangKey('main_site', 'ar'),
                enName: langService.getByLangKey('main_site', 'en')
            });
            self.lookupNames['key_subSite'] = new Information({
                arName: langService.getByLangKey('sub_site', 'ar'),
                enName: langService.getByLangKey('sub_site', 'en')
            });
            return lookup;
        });

        /**
         * @description add dynamic follow up
         */
        self.addDynamicFollowUp = function () {
            validationService
                .createValidation('ADD_DYNAMIC_FOLLOWUP')
                .addStep('check_required', true, self.checkCorrespondenceSitesRequired, self.dynamicFollowup, function (result) {
                    return !result;
                })
                .notifyFailure(function (step, result) {
                    toast.error(langService.get('required_correspondence_sites'));
                })
                .addStep('check_duplicate_name', true, dynamicFollowupService.checkDuplicateDynamicFollowupName, [self.dynamicFollowup, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.dynamicFollowup, self.dynamicFollowUps, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .addStep('check_duplicate', true, dynamicFollowupService.checkDuplicateDynamicFollowup, [self.dynamicFollowup, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('duplication_message'));
                })
                .validate()
                .then(function () {
                    dynamicFollowupService.addDynamicFollowUp(self.dynamicFollowup).then(function () {
                        toast.success(langService.get('add_success').change({name: self.dynamicFollowup.getNames()}));
                        dialog.hide();
                    })
                });
        };
        /**
         *@description edit dynamic follow up
         */
        self.editDynamicFollowUp = function () {
            validationService
                .createValidation('UPDATE_DYNAMIC_FOLLOWUP')
                .addStep('check_required', true, self.checkCorrespondenceSitesRequired, self.dynamicFollowup, function (result) {
                    return !result;
                })
                .notifyFailure(function (step, result) {
                    toast.error(langService.get('required_correspondence_sites'));
                })
                .addStep('check_duplicate_name', true, dynamicFollowupService.checkDuplicateDynamicFollowupName, [self.dynamicFollowup, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.dynamicFollowup, self.dynamicFollowUps, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .addStep('check_duplicate', true, dynamicFollowupService.checkDuplicateDynamicFollowup, [self.dynamicFollowup, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('duplication_message'));
                })
                .validate()
                .then(function () {
                    dynamicFollowupService.updateDynamicFollowUp(self.dynamicFollowup).then(function () {
                        toast.success(langService.get('update_success'));
                        dialog.hide();
                    })
                });
        };

        self.checkCorrespondenceSitesRequired = function (dynamicFollowup) {
            return !dynamicFollowup.ui.key_mainSubSites.value.length;
        }

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        }
    });
};
