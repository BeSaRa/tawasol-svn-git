module.exports = function (app) {
    app.factory('DistributionUserWFItem', function (CMSModelInterceptor, ProxyInfo, moment, cmsTemplate, dialog, langService, DistributionWFItem) {
        'ngInject';
        return function DistributionUserWFItem(model) {
            var self = this;
            DistributionWFItem.call(this);
            self.toUserDomain = null;
            self.appUserOUID = null;
            self.toUserId = null;
            // will delete before send to backend
            self.arOUName = null;
            self.enOUName = null;
            self.proxyInfo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionUserWFItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            DistributionUserWFItem.prototype.mapOUApplicationUser = function (ouApplicationUser) {
                return this
                    .setArName(ouApplicationUser.applicationUser.arFullName)
                    .setEnName(ouApplicationUser.applicationUser.enFullName)
                    .setToUserDomain(ouApplicationUser.applicationUser.domainName)
                    .setAppUserOUID(ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid)
                    .setToUserId(ouApplicationUser.applicationUser.id)
            };

            DistributionUserWFItem.prototype.mapFromWFUser = function (user) {
                return this
                    .setArName(user.arName)
                    .setEnName(user.enName)
                    .setToUserDomain(user.domainName)
                    .setAppUserOUID(user.ouId)
                    .setToUserId(user.id)
                    .setArOUName(user.ouArName)
                    .setEnOUName(user.ouEnName)
                    .setRelationId(user.relationId)
                    .setProxyInfo(user.proxyInfo);
            };

            DistributionUserWFItem.prototype.setToUserDomain = function (toUserDomain) {
                this.toUserDomain = toUserDomain;
                return this;
            };
            DistributionUserWFItem.prototype.setAppUserOUID = function (appUserOUID) {
                this.appUserOUID = appUserOUID;
                return this;
            };
            DistributionUserWFItem.prototype.setToUserId = function (toUserId) {
                this.toUserId = toUserId;
                return this;
            };
            DistributionUserWFItem.prototype.setProxyInfo = function (proxyInfo) {
                this.proxyInfo = proxyInfo ? new ProxyInfo(proxyInfo) : proxyInfo;
                return this;
            };

            DistributionUserWFItem.prototype.getDomainName = function () {
                return this.toUserDomain;
            };

            DistributionUserWFItem.prototype.setArOUName = function (arOUName) {
                this.arOUName = arOUName;
                return this;
            };
            DistributionUserWFItem.prototype.setEnOUName = function (enOUName) {
                this.enOUName = enOUName;
                return this;
            };

            DistributionUserWFItem.prototype.isUserOutOfOffice = function () {
                return this.proxyInfo && this.proxyInfo.outOfOffice && this.proxyInfo.proxyEndDate >= Date.now() && this.proxyInfo.proxyStartDate <= Date.now();
            };

            DistributionUserWFItem.prototype.getTranslatedOrganizationName = function () {
                return this[langService.current + 'OUName'];
            };
            /**
             * @description to check if given user the same user or not
             * @param user
             * @returns {boolean}
             */
            DistributionUserWFItem.prototype.isSameUser = function (user) {
                return user.toUserId === this.toUserId && user.toUserDomain === this.toUserDomain && user.appUserOUID === this.appUserOUID;
            };

            DistributionUserWFItem.prototype.openOutOfOfficeDialog = function ($event) {
                var self = this;
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('out-of-office-message'),
                    bindToController: true,
                    targetEvent: $event,
                    controller: function ($scope, LangWatcher) {
                        'ngInject';
                        var self = this;
                        LangWatcher($scope);
                    },
                    controllerAs: 'ctrl',
                    locals: {
                        userWorkflow: self
                    }
                })
            };

            DistributionUserWFItem.prototype.isDepartment = function () {
                return false;
            };
            DistributionUserWFItem.prototype.isUser = function () {
                return true;
            };
            DistributionUserWFItem.prototype.isGroup = function () {
                return false;
            };

            DistributionUserWFItem.prototype.mapSend = function () {
                delete this.arOUName;
                delete this.enOUName;
                delete this.proxyInfo;
                delete this.arName;
                delete this.enName;
                delete this.relationId;
                delete this.gridName;
                this.action = this.action.hasOwnProperty('id') ? this.action.id : this.action;
                return this;
            };
            /**
             * @description to check if the distWorkflowItem is same.
             * @param distWorkflowItem
             * @returns {boolean}
             */
            DistributionUserWFItem.prototype.isSameWorkflowItem = function (distWorkflowItem) {
                return distWorkflowItem.isUser() ? this.isSameUser(distWorkflowItem) : false;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionUserWFItem', 'init', this);
        }
    })
};