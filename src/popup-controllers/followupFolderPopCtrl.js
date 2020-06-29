module.exports = function (app) {
    app.controller('followupFolderPopCtrl', function (lookupService,
                                                      FollowUpFolder,
                                                      followupFolder,
                                                      editMode,
                                                      $q,
                                                      langService,
                                                      toast,
                                                      validationService,
                                                      followUpUserService,
                                                      counterService,
                                                      generator,
                                                      dialog,
                                                      parent,
                                                      _) {
        'ngInject';
        var self = this;

        self.controllerName = 'followupFolderPopCtrl';
        self.editMode = editMode;
        self.followupFolder = angular.copy(followupFolder);
        self.model = angular.copy(followupFolder);

        self.addFolderHeader = (parent) ? (langService.get('add_new_user_folder') + " - " + parent.getTranslatedName()) : langService.get('add_new_user_folder');
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };

        var currentFolderChildren = self.model.children ? _.map(self.model.children, 'id') : [];
        self.otherFolders = new Array(new FollowUpFolder({
            id: null,
            arName: langService.getKey('parent_folder_option', 'ar'),
            enName: langService.getKey('parent_folder_option', 'en')
        }));

        self.getOtherFolders = function () {
            var allFolders = followUpUserService.allFollowUpFolders;
            for (var i = 0; i < allFolders.length; i++) {
                if (currentFolderChildren.length) {
                    if ((currentFolderChildren.indexOf(allFolders[i].id) === -1) && allFolders[i].id !== self.followupFolder.id) {
                        self.otherFolders.push(allFolders[i]);
                    }
                } else {
                    if (allFolders[i].id !== self.followupFolder.id) {
                        self.otherFolders.push(allFolders[i]);
                    }
                }
            }
        };
        self.getOtherFolders();

        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property])) {
                    // if one of arName or enName is filled, skip the property from required;
                    if ((property === 'arName' && !model['enName']) || (property === 'enName' && !model['arName']))
                        result.push(property);
                }
            });
            return result;
        };

        /**
         * Add new User Folder
         */
        self.addFollowUpFolderFromCtrl = function () {
            validationService
                .createValidation('ADD_USER_FOLDER')
                .addStep('check_required', true, self.checkRequiredFields, self.followupFolder, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, followUpUserService.checkDuplicateFollowUpFolder, [self.followupFolder, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    followUpUserService.addFollowUpFolder(self.followupFolder).then(function () {
                        toast.success(langService.get('add_success').change({name: self.followupFolder.getTranslatedName()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * Edit User Folder
         */
        self.editFollowUpFolderFromCtrl = function () {
            validationService
                .createValidation('EDIT_USER_FOLDER')
                .addStep('check_required', true, self.checkRequiredFields, self.followupFolder, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, followUpUserService.checkDuplicateFollowUpFolder, [self.followupFolder, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    followUpUserService.updateFollowUpFolder(self.followupFolder).then(function (result) {
                        toast.success(langService.get('edit_success').change({name: self.followupFolder.getTranslatedName()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        self.validateStatus = function () {
            if (self.editMode && !self.followupFolder.status && counterService.followupFolderCount.hasOwnProperty(self.model.id) && counterService.followupFolderCount[self.model.id].first > 0) {
                self.followupFolder.status = true;
                toast.warning(langService.get('cannot_disable_folder_has_document'));
            }
        };

        /**
         * @description Close the popup
         */
        self.closeFollowUpFolderPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};
