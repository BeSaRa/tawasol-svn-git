module.exports = function (app) {
    app.factory('DistributionGroupWFItem', function (CMSModelInterceptor, DistributionWFItem, langService, rootEntity) {
        'ngInject';
        return function DistributionGroupWFItem(model) {
            var self = this;
            DistributionWFItem.call(this);
            self.wfGroupId = null;
            self.sendRelatedDocs = false;
            self.members = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            DistributionGroupWFItem.prototype.getTranslatedName = function (reverse) {
                var name = '', naValue = 'N/A';
                if (langService.current === 'ar') {
                    if (reverse)
                        name = this.enName && this.enName !== naValue ? this.enName : this.arName;
                    else
                        name = this.arName && this.arName !== naValue ? this.arName : this.enName;
                } else if (langService.current === 'en') {
                    if (reverse)
                        name = this.arName && this.arName !== naValue ? this.arName : this.enName;
                    else
                        name = this.enName && this.enName !== naValue ? this.enName : this.arName;
                }
                return name;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionGroupWFItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DistributionGroupWFItem.prototype.isDepartment = function () {
                return false;
            };
            DistributionGroupWFItem.prototype.isUser = function () {
                return false;
            };
            DistributionGroupWFItem.prototype.isGroup = function () {
                return true;
            };
            DistributionGroupWFItem.prototype.setWfMembers = function (members) {
                this.members = members;
                return this;
            };
            DistributionGroupWFItem.prototype.mapFromWFGroup = function (workflowGroup) {
                var globalSettings = rootEntity.getGlobalSettings();
                return this
                    .setArName(workflowGroup.arName)
                    .setEnName(workflowGroup.enName)
                    .setWfGroupId(workflowGroup.id)
                    .setSendSMS(workflowGroup.sendSMS)
                    .setSendSMS(workflowGroup.sendEmail)
                    .setWfMembers(workflowGroup.members)
                    .setSendRelatedDocs(globalSettings.canSendRelatedDocsToSameDepartmentOnly() ?
                        this.isSendRelatedDocsAllowed() : globalSettings.isSendRelatedDocsAllowed());
            };
            DistributionGroupWFItem.prototype.setWfGroupId = function (wfGroupId) {
                this.wfGroupId = wfGroupId;
                return this;
            };
            DistributionGroupWFItem.prototype.isSameGroup = function (workflowGroup) {
                return this.wfGroupId === workflowGroup.wfGroupId;
            };
            DistributionGroupWFItem.prototype.mapSend = function () {
                // delete it when send to service.
                delete this.arName;
                delete this.enName;
                delete this.relationId;
                delete this.gridName;
                delete this.selectedWFAction;
                delete this.actionSearchText;
                delete this.selectedWFComment;
                delete this.commentSearchText;
                delete this.tempRegOUSection;
                delete this.showCommentDropdown;
                delete this.forwardSenderActionAndComment;

                this.escalationStatus = (this.escalationStatus && this.escalationStatus.hasOwnProperty('id')) ? this.escalationStatus.lookupKey : this.escalationStatus;
                if (this.escalationStatus === -1) {
                    this.escalationStatus = null;
                }
                this.escalationUserOUId = (this.escalationUserId && this.escalationUserId.hasOwnProperty('ouId')) ? this.escalationUserId.ouId : this.escalationUserOUId;
                this.escalationUserId = (this.escalationUserId && this.escalationUserId.hasOwnProperty('id')) ? this.escalationUserId.id : this.escalationUserId;

                this.action = this.action.hasOwnProperty('id') ? this.action.id : this.action;
                return this;
            };
            /**
             * @description to check if the distWorkflowItem is same.
             * @param distWorkflowItem
             * @returns {boolean}
             */
            DistributionGroupWFItem.prototype.isSameWorkflowItem = function (distWorkflowItem) {
                return distWorkflowItem.isGroup() ? this.isSameGroup(distWorkflowItem) : false;
            };

            DistributionGroupWFItem.prototype.isSendRelatedDocsAllowed = function () {
                return false
            }
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionGroupWFItem', 'init', this);
        }
    })
};
