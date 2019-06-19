module.exports = function (app) {
    app.service('administratorService', function (urlService,
                                                  $http,
                                                  $q,
                                                  _,
                                                  generator,
                                                  Administrator,
                                                  cmsTemplate,
                                                  dialog,
                                                  langService,
                                                  toast) {
        'ngInject';
        var self = this;
        self.serviceName = 'administratorService';

        self.administrators = [];
        self.superAdmins = [];

        /**
         * @description Load the administrators from server.
         * @returns {Promise|administrators}
         */
        self.loadAllAdministrators = function () {
            return $http.get(urlService.userAdminList).then(function (result) {
                self.administrators = generator.generateCollection(result.data.rs, Administrator);
                self.administrators = generator.interceptReceivedCollection('Administrator', self.administrators);
                return self.administrators;
            });
        };

        /**
         * @description Get administrators from self.administrators if found and if not load it from server again.
         * @returns {Promise|administrators}
         */
        self.getAllAdministrators = function () {
            return self.administrators.length ? $q.when(self.administrators) : self.loadAllAdministrators();
        };

        /**
         * @description Load the super admins from server.
         * @returns {Promise|superAdmins}
         */
        self.loadSuperAdministrators = function () {
            return $http.get(urlService.userAdminList + '/super-admin-list').then(function (result) {
                self.superAdmins = generator.generateCollection(result.data.rs, Administrator);
                self.superAdmins = generator.interceptReceivedCollection('Administrator', self.superAdmins);
                return self.superAdmins;
            });
        };

        /**
         * @description Get super admins from self.superAdmins if found and if not load it from server again.
         * @returns {Promise|superAdmins}
         */
        self.getSuperAdministrators = function () {
            return self.superAdmins.length ? $q.when(self.superAdmins) : self.loadSuperAdministrators();
        };

        /**
         * @description Loads the administrators by userId
         * @param userId
         * @param returnOuIdsOnly
         * @returns {*}
         * Returns the admin list for given user
         */
        self.loadAdministratorsByUserId = function (userId, returnOuIdsOnly) {
            userId = userId.hasOwnProperty('id') ? userId.id : userId;
            return $http.get(urlService.userAdminList + '/user-id/' + userId).then(function (result) {
                var administrators = generator.generateCollection(result.data.rs, Administrator);
                administrators = generator.interceptReceivedCollection('Administrator', administrators);
                if (returnOuIdsOnly) {
                    var admins = [];
                    _.map(administrators, function (admin) {
                        if (admin.adminOnRegOUID) {
                            admins.push(admin.adminOnRegOUID)
                        }
                        return admin;
                    });
                    return admins;
                }
                return administrators;
            });
        };

        /**
         * @description Contains methods for CRUD operations for administrators
         */
        self.controllerMethod = {
            /**
             * @description Opens the dialog to add new super-admin/sub-admin
             * @returns {promise}
             */
            openAddDialog: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('administrator'),
                        controller: 'administratorPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: false,
                            administrator: new Administrator()
                        }
                    });
            },
            openEditDialog: function (record, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('administrator'),
                        controller: 'administratorPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            administrator: angular.copy(record)
                        }
                    });
            },
            openAdminOrganizationsDialog: function (administrator, $event) {
                if (administrator.isSuperAdmin) return;
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('administrator-ous-list'),
                        controller: 'administratorOusListPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            administrator: administrator
                        },
                        resolve: {
                            adminOus: function () {
                                'ngInject';
                                return self.loadAdministratorsByUserId(administrator.userId);
                            }
                        }
                    });
            }
        };

        /**
         * @description Saves the administrator
         * @param administrator
         * @returns {*}
         */
        self.saveAdministrator = function (administrator) {
            return $http.post(urlService.userAdminList + '/bulk/user-id/' + administrator.userId, generator.interceptSendInstance('Administrator', administrator))
                .then(function (result) {
                    return result;
                });
        };
    });
};
