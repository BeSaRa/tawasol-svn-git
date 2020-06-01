module.exports = function (app) {
    app.controller('followupUserOrganizationPopCtrl', function (ouApplicationUserService,
                                                                _,
                                                                toast,
                                                                generator,
                                                                dialog,
                                                                gridService,
                                                                langService,
                                                                $filter,
                                                                $timeout,
                                                                followupOrganizations,
                                                                ouApplicationUser,
                                                                FollowupOrganization,
                                                                organizationService,
                                                                rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'followupUserOrganizationPopCtrl';

        self.inlineUserOUSearchText = '';

        self.followupOrganizations = followupOrganizations;
        self.registryOrganizations = organizationService.getAllRegistryOrganizations();
        self.subOrganizations = [];
        self.Ou = null;
        self.regOu = null;
        self.selectedSecurityLevels = null;
        self.selectedFollowupOrganizations = [];
        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
        self.ouApplicationUser = ouApplicationUser;

        var _resetFollowupOUModel = function () {
            self.Ou = null;
            self.regOu = null;
            self.selectedSecurityLevels = null;

            self.followupOrganization = new FollowupOrganization({
                userId: ouApplicationUser.applicationUser.id,
                ouId: ouApplicationUser.ouid.id
            });
        };
        _resetFollowupOUModel();

        /**`
         * @description add followup organization
         */
        self.addFollowupOrganizationFromCtrl = function ($event) {
            self.followupOrganization.followeeOUId = (self.Ou) ? self.Ou : self.regOu;
            if (self.Ou) {
                self.followupOrganization.followeeOUId.hasRegistry = false;
            }
            self.followupOrganization.canEditDelete = true;
            self.followupOrganization.ouInfo = angular.copy(self.followupOrganization.followeeOUId);
            self.followupOrganization.securityLevels = self.selectedSecurityLevels;
            self.followupOrganizations.push(self.followupOrganization);

            _resetFollowupOUModel();
        };

        /**
         * @description
         */
        self.saveFollowupOrganizationFromCtrl = function () {
            ouApplicationUserService
                .addFollowupUserOrganizations(self.followupOrganizations, ouApplicationUser.applicationUser.id, ouApplicationUser.ouid.id)
                .then(function (result) {
                    toast.success(langService.get('save_success'));
                    //  self.closeFollowupUserOrganizationPopup();
                }).catch(function () {

            });

        };


        self.changeWithSubsBulkOrganizations = function (status) {
            self.followupOrganizations = _.map(self.followupOrganizations, function (followupOrganization) {
                followupOrganization.withSubs = (status === 'activate');
                return followupOrganization;
            });
        };

        /**
         * @description
         * @param followupOu
         * @param $index
         * @param $event
         */
        self.removeFollowupEmployee = function (followupOu, $index, $event) {
            return dialog
                .confirmMessage(langService.get('confirm_remove').change({name: followupOu.ouInfo.getTranslatedName()}), null, null, $event)
                .then(function () {
                    self.followupOrganizations.splice($index, 1);
                });
        };

        /**
         * @description
         */
        self.removeBulkFollowupEmployee = function ($event) {
            return dialog
                .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                .then(function () {
                    var ids = _.map(self.selectedFollowupOrganizations, 'ouInfo.id');
                    self.followupOrganizations = _.filter(self.followupOrganizations, function (followupOrganization) {
                        return ids.indexOf(followupOrganization.ouInfo.id) === -1;
                    });

                    self.selectedFollowupOrganizations = [];
                });

        };

        self.onRegistryChanged = function () {
            self.subOrganizations = [];
            organizationService
                .loadChildrenOrganizations(self.regOu, true)
                .then(function (result) {
                    // sort sections/sub-organizations
                    result = _.sortBy(result, [function (ou) {
                        return ou[langService.current + 'Name'].toLowerCase();
                    }]);

                    self.subOrganizations = result;
                })
        };

        self.getTranslatedWithSubs = function (ou) {
            return ou.withSubs ? langService.get('with_subs_ou') : langService.get('without_subs_ou');
        };

        /**
         * @description Filter already added organizations to skip it in dropdown.
         * @returns {Array}
         */
        self.includeOrganizationsIfNotExists = function (organization) {
            return _.map(self.followupOrganizations, function (ou) {
                return ou.ouInfo.id
            }).indexOf(organization.id) === -1;
        };


        self.isAddFollowupOrganizationDisabled = function () {
            return !self.regOu ||
                (!self.Ou &&
                    _.map(self.followupOrganizations, function (ou) {
                        return ou.ouInfo.id;
                    }).indexOf(self.regOu.id) !== -1);
        };

        self.isRegOuDisabled = function (organization) {
            return !organization.status ||
                _.some(self.followupOrganizations, function (ou) {
                    return ou.ouInfo.id === organization.id && ou.withSubs;
                });
        };

        self.isSecurityLevelExistsInOu = function (securityLevel) {
            return _.some(self.ouApplicationUser.securityLevels, function (item) {
                return item.lookupKey === securityLevel.lookupKey;
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
         * @description Close the popup
         */
        self.closeFollowupUserOrganizationPopup = function () {
            dialog.cancel();
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.followupOrganizations = $filter('orderBy')(self.followupOrganizations, self.grid.order);
        };

        /**
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         * @type {Array}
         */
        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.followupOrganizations.length + 21);
                    }
                }
            ]
        };
    });
};
