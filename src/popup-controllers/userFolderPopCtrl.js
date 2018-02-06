module.exports = function (app) {
    app.controller('userFolderPopCtrl', function (lookupService,
                                                  UserFolder,
                                                  userFolder,
                                                  editMode,
                                                  $q,
                                                  langService,
                                                  toast,
                                                  validationService,
                                                  userFolderService,
                                                  generator,
                                                  dialog,
                                                  parent) {
        'ngInject';
        var self = this;

        self.controllerName = 'userFolderPopCtrl';
        self.editMode = editMode;
        self.userFolder = angular.copy(userFolder);
        self.model = angular.copy(userFolder);

        self.addFolderHeader = (parent) ? (langService.get('add_new_user_folder') + " - " + parent.getTranslatedName()) : langService.get('add_new_user_folder');
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };

        var currentFolderChildren = self.model.children ? _.map(self.model.children, 'id') : [];
        self.otherFolders = new Array(new UserFolder({
            id: null,
            arName: langService.getKey('parent_folder_option', 'ar'),
            enName: langService.getKey('parent_folder_option', 'en')
        }));
        self.getOtherFolders = function () {
            var allFolders = userFolderService.allUserFolders;
            for (var i = 0; i < allFolders.length; i++) {
                if (currentFolderChildren.length) {
                    if ((currentFolderChildren.indexOf(allFolders[i].id) === -1) && allFolders[i].id !== self.userFolder.id) {
                        self.otherFolders.push(allFolders[i]);
                    }
                }
                else {
                    if (allFolders[i].id !== self.userFolder.id) {
                        self.otherFolders.push(allFolders[i]);
                    }
                }
            }
        };
        self.getOtherFolders();

        /**
         * Add new User Folder
         */
        self.addUserFolderFromCtrl = function () {
            validationService
                .createValidation('ADD_USER_FOLDER')
                .addStep('check_required', true, generator.checkRequiredFields, self.userFolder, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, userFolderService.checkDuplicateUserFolder, [self.userFolder, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    userFolderService.addUserFolder(self.userFolder).then(function () {
                        toast.success(langService.get('add_success').change({name: self.userFolder.getTranslatedName()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * Edit User Folder
         */
        self.editUserFolderFromCtrl = function () {
            validationService
                .createValidation('EDIT_USER_FOLDER')
                .addStep('check_required', true, generator.checkRequiredFields, self.userFolder, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, userFolderService.checkDuplicateUserFolder, [self.userFolder, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    userFolderService.updateUserFolder(self.userFolder).then(function (result) {
                        toast.success(langService.get('edit_success').change({name: self.userFolder.getTranslatedName()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closeUserFolderPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};