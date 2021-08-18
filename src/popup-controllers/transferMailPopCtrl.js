module.exports = function (app) {
    app.controller('transferMailPopCtrl', function (workItems,
                                                    correspondenceService,
                                                    dialog,
                                                    organizations,
                                                    currentFollowedUpOu,
                                                    currentFollowedUpUser,
                                                    allowedMaxLength,
                                                    ouApplicationUserService,
                                                    comments,
                                                    _,
                                                    langService,
                                                    Information,
                                                    distributionWFService,
                                                    generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'transferMailPopCtrl';
        // selected comment from users comments
        self.selectedComment = null;
        // the default reason for terminate
        self.reason = null;
        // workItems
        self.workItems = angular.copy(workItems);
        // if it is bulk workItems.
        self.isArray = angular.isArray(workItems);
        // all comments
        self.comments = comments;
        // current followed up ou
        self.currentFollowedUpOu = currentFollowedUpOu;
        // current followed up user
        self.currentFollowedUpUser = currentFollowedUpUser;
        // all ouApplication users
        self.ouApplicationUsers = [];
        // selected organization unit
        self.selectedOrganization = null;
        // selected application user to set it
        self.selectedApplicationUser = null;
        self.allowedMaxLength = allowedMaxLength;

        self.selectedUserDomain = null;
        self.ouSearchText = '';
        self.appUserSearchText = '';
        self.commentSearchText = '';

        var _mapRegOUSections = function () {
            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(organizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                parentRegistryOu = (section.regouId || section.regOuId);
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(organizations, function (ou) {
                        return ou.id === parentRegistryOu;
                    })
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
        };
        self.organizations = _mapRegOUSections();

        self.setSelectedReason = function () {
            self.reason = self.selectedComment.getComment();
        };

        function _setCustomAppUser(userDomain) {
            if (!self.isArray) {
                self.workItems.domainName = userDomain;
            } else {
                _.map(self.workItems, function (item) {
                    item.domainName = userDomain;
                    return item;
                });
            }
        }

        self.setSelectedUser = function () {
            self.selectedUserDomain = null;
            if (self.selectedApplicationUser) {
                self.selectedUserDomain = self.selectedApplicationUser.domainName;
            }
            _setCustomAppUser(generator.getNormalizedValue(self.selectedApplicationUser, 'domainName'));
        };

        self.itemNeedReason = function () {
            if (!self.isArray)
                return !self.reason;

            return _.some(self.workItems, function (workItem) {
                return !workItem.reason;
            });
        };

        self.itemNeedUser = function () {
            if (!self.isArray)
                return !self.selectedApplicationUser;

            return _.some(self.workItems, function (workItem) {
                return !workItem.domainName;
            });
        };

        self.hasCustomReason = function (workItem) {
            return !!workItem.reason;
        };

        self.hasCustomUser = function (workItem) {
            return !!workItem.domainName;
        };

        self.transferMail = function () {
            var data = null;
            if (!self.isArray) {
                var info = workItems.getInfo();
                data = {
                    wobNumber: info.wobNumber,
                    comment: self.reason,
                    user: self.selectedUserDomain,
                    appUserOUID: self.selectedOrganization
                };
            } else {
                data = _.map(self.workItems, function (workItem) {
                    workItem.comment = self.hasCustomReason(workItem) ? workItem.reason : self.reason;
                    workItem.user = workItem.domainName;
                    workItem.appUserOUID = self.selectedOrganization;
                    return workItem;
                });
            }
            dialog.hide(data);
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getAppUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            return distributionWFService
                .searchUsersByCriteria({ou: self.selectedOrganization})
                .then(function (result) {
                    // transfer should not be to current user in current ou
                    result = _.filter(result, function (item) {
                        return !(item.id === generator.getNormalizedValue(self.currentFollowedUpUser, 'id')
                            && item.ouId === generator.getNormalizedValue(self.currentFollowedUpOu, 'id'));
                    });
                    self.applicationUsers = result;
                    self.selectedApplicationUser = null;
                    _setCustomAppUser(null);
                    self.inProgress = false;
                    return result;
                });
        };

        self.closeTransferReason = function () {
            dialog.cancel();
        };

        self.openReasonDialog = function (workItem, $event) {
            correspondenceService
                .openCommentDialog(self.allowedMaxLength)
                .then(function (reason) {
                    workItem.reason = reason;
                });
        };

        self.nothingNeedUserReason = function () {
            return self.itemNeedReason() || self.itemNeedUser();
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


    });
};
