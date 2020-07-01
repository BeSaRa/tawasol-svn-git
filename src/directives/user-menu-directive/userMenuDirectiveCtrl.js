module.exports = function (app) {
    app.controller('userMenuDirectiveCtrl', function (employeeService,
                                                      $timeout,
                                                      $state,
                                                      rootEntity,
                                                      _,
                                                      counterService,
                                                      dialog,
                                                      authenticationService,
                                                      applicationUserService,
                                                      moveToFolderService,
                                                      toast,
                                                      langService,
                                                      correspondenceService,
                                                      $window,
                                                      errorCode) {
        'ngInject';
        var self = this;
        self.controllerName = 'userMenuDirectiveCtrl';
        self.employee = employeeService.getEmployee();
        self.employeeService = employeeService;
        self.globalSettings = rootEntity.getGlobalSettings();
        self.rootEntity = rootEntity.returnRootEntity().rootEntity;
        // selected status by default
        self.selectedStatus = {
            id: 1,
            title: 'Online',
            icon: 'check-circle',
            class: 'online-status'
        };

        self.appearanceRoles = {
            admin: {
                display: false,
                permissions: ['menu_item_system_administration']
            },
            user: {
                display: false,
                permissions: [
                    'menu_item_department_inbox',
                    'menu_item_outgoing',
                    'menu_item_incoming',
                    'menu_item_internal',
                    'menu_item_inbox',
                    'menu_item_dashboard',
                    'menu_item_central_archive_mail',
                    // 'menu_item_icn_archive',
                    'menu_item_g2g',
                    'menu_item_reports'
                ]
            }
        };

        self.userManualList = [
            {
                id: 1,
                title: 'manual_admin_arabic',
                file: 'admin-arabic.pdf',
                role: 'admin'
            },
            {
                id: 2,
                title: 'manual_admin_english',
                file: 'admin-english.pdf',
                role: 'admin'
            },
            {
                id: 3,
                title: 'manual_user_arabic',
                file: 'user-arabic.pdf',
                role: 'user'
            },
            {
                id: 4,
                title: 'manual_user_english',
                file: 'user-english.pdf',
                role: 'user'
            },
            {
                id: 5,
                title: 'manual_add_in_arabic',
                file: 'add-in-arabic.pdf',
                role: 'user'
            },
            {
                id: 6,
                title: 'manual_add_in_english',
                file: 'add-in-english.pdf',
                role: 'user'
            }
        ];

        // away -> clock
        // online -> check-circle
        // don't disturb -> minus-circle
        // invisible -> circle-outline - disabled
        // offline -> circle-outline
        self.statusList = [
            {
                id: 1,
                title: 'Online',
                icon: 'check-circle',
                class: 'online-status'
            },
            {
                id: 2,
                title: 'Away',
                icon: 'clock',
                class: 'away-status'
            },
            {
                id: 3,
                title: 'Do not Disturb',
                icon: 'minus-circle',
                class: 'disturb-status'
            },
            {
                id: 4,
                title: 'Invisible',
                icon: 'circle-outline',
                class: 'invisible-status'
            },
            {
                id: 5,
                title: 'Offline',
                icon: 'circle-outline',
                class: 'offline-status'
            }
        ];

        function _prepareUserGuide() {
            _.map(self.appearanceRoles, function (role, key) {
                self.appearanceRoles[key].display = _.some(role.permissions, function (permission) {
                    return employeeService.employeeHasPermissionTo(permission);
                })
            })
        }

        // first run to take the values to deiplay/hide the guides depend on permissions.
        _prepareUserGuide();

        /**
         * select status from available status to set it selectedStatus variable .
         * @param status
         */
        self.selectStatus = function (status) {
            self.selectedStatus = status;
        };
        /**
         * to check if the given status selected
         * @param status
         * @return {boolean}
         */
        self.isStatusSelected = function (status) {
            return status.id === self.selectedStatus.id;
        };

        // deprecated method
        self.getOffset = function () {
            return '-15 0';
        };
        /**
         * @description Opens the popup for user preferences
         * @param $event
         */
        self.userPreferences = function ($event) {
            applicationUserService
                .controllerMethod
                .manageUserPreference(null, 'general', $event)
        };

        /**
         * @description Opens the popup for manage Subscriptions
         * @param $event
         */
        self.manageSubscriptions = function ($event) {
            applicationUserService
                .controllerMethod
                .manageSubscriptions($event)
        };

        /**
         * @description switch organization
         * @param organization
         * @returns {boolean}
         */
        self.switchOrganization = function (organization) {
            if (self.isCurrentOrganization(organization))
                return true;

            authenticationService
                .selectDepartmentToLogin(organization)
                .then(function () {
                    $state.reload();
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'INACTIVE_USER_ENTITY', function () {
                        toast.error(langService.get('can_not_login_with_inactive_user_or_entity'));
                    });
                });
        };
        /**
         * @description if the current organization is selected.
         * @param organization
         * @returns {boolean}
         */
        self.isCurrentOrganization = function (organization) {
            if (!organization)
                return false;

            return organization.id === self.employee.organization.ouid;
        };

        /**
         * @description open popup to move work items from one folder to another
         */
        self.moveToFolders = function () {
            moveToFolderService.controllerMethod.moveToFolder().then(function () {

            });
        };

        /**
         * logout employee
         */
        self.logoutEmployee = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_logout'), null, null, $event)
                .then(function () {
                    authenticationService.logout().then(function () {
                        $state.go('login', {identifier: rootEntity.getRootEntityIdentifier()});
                    });
                });
        };

        self.openUserMenu = function ($mdMenu) {
            if (!employeeService.isAdminUser()) {
                $mdMenu.open();
            } else {
                dialog.infoMessage(langService.get('this_is_a_super_admin'))
            }
        };

        self.downloadGuide = function (guide) {
            var element = angular.element('<a download target="_blank" id="' + guide.file + '" href="guides/' + guide.file + '"></a>');
            angular
                .element('body')
                .append(element);

            element[0].click();
        };

        self.manageDocumentLinks = function ($event) {
            correspondenceService.openUserLinksPopup($event);
        };

        self.openMSTeamsSupport = function ($event) {
            $window.open(self.globalSettings.msTeamsSupoortURL);
        };

        self.isMSTeamsAvailable = function () {
            return self.rootEntity && self.rootEntity.isMSTeamsEnabled && self.globalSettings.msTeamsSupoortURL;
        };

        employeeService
            .employeePermissionChanged(function () {
                _prepareUserGuide();
            });
    });
};
