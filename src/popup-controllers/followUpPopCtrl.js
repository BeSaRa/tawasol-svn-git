module.exports = function (app) {
    app.controller('followUpPopCtrl', function (followUpData,
                                                followUpUserService,
                                                folders,
                                                toast,
                                                langService,
                                                dialog,
                                                addToMyFollowup,
                                                ouApplicationUsers,
                                                organizationForSLA,
                                                moment,
                                                generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'followUpPopCtrl';
        self.model = followUpData;
        self.folders = folders || [];

        self.addToMyFollowup = addToMyFollowup;
        // if followup for other user, don't use folders
        if (!addToMyFollowup) {
            self.folders = [];
        }
        // used for followup for other user
        self.ouApplicationUsers = ouApplicationUsers;
        self.selectedUser = null;
        self.appUserSearchText = '';
        self.inProgress = false;

        self.minDate = new Date();
        //self.minDate.setDate(self.minDate.getDate() + 1);
        self.minDateString = moment(self.minDate).format(generator.defaultDateFormat);

        // if no followupDate, set followupDate from organization SLA
        if (!self.model.followupDate) {
            self.model.followupDate = generator.getNextDaysDate(organizationForSLA.sla[followUpData.priorityLevel]);
        }

        /**
         * @description Gets the folder for selected application user
         */
        self.getUserFollowupFolders = function () {
            self.folders = [];

            if (!self.selectedUser) {
                return;
            }
            self.inProgress = true;
            followUpUserService.loadFollowupFoldersByOuAndUser(self.selectedUser.getOuId(), self.selectedUser.getApplicationUserId(), false)
                .then(function (folders) {
                    self.folders = folders;
                    self.inProgress = false;
                })
        };

        /**
         * @description Reset the filter and search for user followup books again
         */
        self.onChangeUser = function () {
            self.model.folderId = null;
            self.getUserFollowupFolders();
        };


        self.saveToFollowUp = function () {
            var modelToSave = angular.copy(self.model);
            if (!addToMyFollowup){
                modelToSave.userId = self.selectedUser.getApplicationUserId();
                modelToSave.userOUID = self.selectedUser.getOuId();
            }

            return followUpUserService
                .saveUserFollowUp(modelToSave)
                .then(function () {
                    toast.success(langService.get('followup_added_successfully').change({name: modelToSave.docSubject}));
                    dialog.hide();
                });
        };

        /**
         * @description Checks if followup is valid
         * @returns {boolean|*|null}
         */
        self.isValidFollowup = function (form) {
            var isValid = form.$valid && !self.inProgress && self.model.folderId && (self.model.followupDate && self.model.followupDate >= self.minDate);
            if (addToMyFollowup) {
                return isValid;
            }
            return isValid && self.selectedUser;
        };


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };


        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.closeDialog = function () {
            dialog.cancel();
        };


    });
};
