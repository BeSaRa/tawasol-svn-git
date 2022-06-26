module.exports = function (app) {
    app.controller('administratorPopCtrl', function (_,
                                                     toast,
                                                     tokenService,
                                                     administrator,
                                                     generator,
                                                     dialog,
                                                     applicationUserService,
                                                     ouApplicationUserService,
                                                     editMode,
                                                     administratorService,
                                                     $timeout,
                                                     applicationUsers,
                                                     organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'administratorPopCtrl';
        self.editMode = editMode;

        self.administrator = angular.copy(administrator);
        self.model = angular.copy(self.administrator);

        self.applicationUsers = applicationUsers;
        self.applicationUsersCopy = angular.copy(self.applicationUsers);
        self.applicationUserSearchText = '';

        self.allRegOus = organizationService.getAllRegistryOrganizations();
        self.allRegOusCopy = angular.copy(self.allRegOus);
        self.regOuSearchText = '';

        if (editMode) {
            $timeout(function () {
                self.onChangeUser();
            })
        }

        /**
         * @description Handles the change of super admin checkbox
         * @param $event
         */
        self.onChangeSuperAdmin = function ($event) {
            _resetSelectedOus($event);
        };

        self.isAlreadySuperAdmin = function (applicationUserId) {
            applicationUserId = applicationUserId.hasOwnProperty('id') ? applicationUserId.id : applicationUserId;
            return !!(_.find(administratorService.administrators, function (admin) {
                return admin.userId === applicationUserId && !!admin.isSuperAdmin;
            }));
        };

        /**
         * @description Handles the change of user drop down
         * @param $event
         */
        self.onChangeUser = function ($event) {
            if (self.administrator.userId) {
                if (self.isAlreadySuperAdmin(self.administrator.userId)) {
                    self.administrator.isSuperAdmin = true;
                    _resetSelectedOus();
                } else {
                    self.administrator.isSuperAdmin = false;
                    administratorService.loadAdministratorsByUserId(self.administrator.userId, true)
                        .then(function (result) {
                            /*var admins = [];
                            _.map(result, function (admin) {
                                if (admin.adminOnRegOUID) {
                                    admins.push(admin.adminOnRegOUID)
                                }
                                return admin;
                            });*/
                            self.administrator.adminOnRegOUList = result;
                        })
                }
            }
        };

        var _resetSelectedOus = function () {
            self.administrator.adminOnRegOUList = [];
        };


        self.saveAdministrator = function () {
            return administratorService.saveAdministrator(self.administrator)
                .then(function () {
                    dialog.hide(self.administrator);
                });
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
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
         * @description load application users by search text
         * @param $event
         */
        self.loadApplicationUsers = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            applicationUserService
                .loadApplicationUsersView(1, 25, self.applicationUserSearchText)
                .then(function (result) {
                    if (result.length) {
                        self.applicationUsers = result;
                        self.applicationUsersCopy = angular.copy(self.applicationUsers);
                    } else {
                        self.applicationUsers = angular.copy(self.applicationUsersCopy);
                    }
                });
        }

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
