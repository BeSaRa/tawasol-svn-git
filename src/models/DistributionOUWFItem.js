module.exports = function (app) {
    app.factory('DistributionOUWFItem', function (CMSModelInterceptor, langService, DistributionWFItem, rootEntity, generator) {
        'ngInject';
        return function DistributionOUWFItem(model) {
            var self = this;
            DistributionWFItem.call(this);
            self.toOUId = null;
            self.originality = null;
            self.hasRegistry = false;
            self.sendRelatedDocs = rootEntity.getGlobalSettings().allowSendWFRelatedBook;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionOUWFItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DistributionOUWFItem.prototype.getTranslatedName = function () {
                return this[langService.current + 'Name'];
            };
            DistributionOUWFItem.prototype.getTranslatedNameRegOUSection = function () {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[langService.current + 'Name']
                }
                return this[langService.current + 'Name'];
            };
            DistributionOUWFItem.prototype.getNameByLanguageRegOUSection = function (language) {
                if (this.tempRegOUSection) {
                    return this.tempRegOUSection[language + 'Name']
                }
                return this[language + 'Name'];
            };
            DistributionOUWFItem.prototype.isDepartment = function () {
                return true;
            };
            DistributionOUWFItem.prototype.isUser = function () {
                return false;
            };
            DistributionOUWFItem.prototype.isGroup = function () {
                return false;
            };
            DistributionOUWFItem.prototype.mapFromWFOrganization = function (organization) {
                return this
                    .setRelationId(organization.relationId)
                    .setArName(organization.arName)
                    .setEnName(organization.enName)
                    .setHasRegistry(organization.hasRegistry)
                    .setToOUId(organization.id)
                    .setSendSMS(organization.sendSMS)
                    .setSendEmail(organization.sendEmail)
                    .setRegOuId(organization.regouId || organization.regOuId)
                    .setTempRegOUSection(organization.tempRegOUSection);
            };
            DistributionOUWFItem.prototype.mapFromPredefinedActionMemberOrganization = function (organization, forLaunch) {
                this
                    //.setRelationId(organization.toOUInfo.relationId)
                    .setArName(organization.toOUInfo.arName)
                    .setEnName(organization.toOUInfo.enName)
                    .setHasRegistry(organization.toOUInfo.hasRegistry)
                    .setToOUId(organization.toOUID)
                    .setSendSMS(organization.sendSMS)
                    .setSendEmail(organization.sendEmail)
                    .setRegOuId(organization.toOUInfo.regouId || organization.toOUInfo.regOuId)
                    //.setTempRegOUSection(organization.tempRegOUSection)
                    .setEscalationStatus(organization.escalationStatus)
                    .setEscalationUser(organization.escalationUserId)
                    .setEscalationUserOUId(organization.escalationUserOUId)
                    .setAction(organization.wfActionInfo)
                    .setComments(organization.userComment)
                    .setSecureAction(organization.secureComment)
                    .setSendRelatedDocs(organization.sendRelatedDocs);

                if (!forLaunch) {
                    this.setSLADueDate(organization.sLADueDate)
                } else {
                    if (organization.sLADueDate) {
                        var dueDate = generator.getFutureDate(organization.sLADueDate);
                        this.setDueDate(dueDate);
                    }
                }

                return this;
            };
            DistributionOUWFItem.prototype.setToOUId = function (toOUId) {
                this.toOUId = toOUId;
                return this;
            };
            DistributionOUWFItem.prototype.setOriginality = function (originality) {
                this.originality = originality;
                return this;
            };
            DistributionOUWFItem.prototype.setHasRegistry = function (hasRegistry) {
                this.hasRegistry = hasRegistry;
                return this;
            };
            DistributionOUWFItem.prototype.isSameDepartment = function (workflowItem) {
                return this.toOUId === workflowItem.toOUId;
            };
            DistributionOUWFItem.prototype.mapSend = function (emptyEscalation) {
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

                if (emptyEscalation) {
                    this.escalationUserId = null;
                    this.escalationUserOUId = null;
                    this.escalationStatus = null;
                    this.dueDate = null;
                }
                this.escalationStatus = (this.escalationStatus && this.escalationStatus.hasOwnProperty('id')) ? this.escalationStatus.lookupKey : this.escalationStatus;
                if (this.escalationStatus === -1) {
                    this.escalationStatus = null;
                }
                this.escalationUserOUId = (this.escalationUserId && this.escalationUserId.hasOwnProperty('ouId')) ? this.escalationUserId.ouId : this.escalationUserOUId;
                this.escalationUserId = (this.escalationUserId && this.escalationUserId.hasOwnProperty('id')) ? this.escalationUserId.id : this.escalationUserId;

                this.action = this.action.hasOwnProperty('id') ? this.action.id : this.action;
                this.toOUId = typeof this.toOUId === 'string' ? Number(this.toOUId.substr(1)) : this.toOUId;
                return this;
            };
            /**
             * @description to check if the distWorkflowItem is same.
             * @param distWorkflowItem
             * @returns {boolean}
             */
            DistributionOUWFItem.prototype.isSameWorkflowItem = function (distWorkflowItem) {
                return distWorkflowItem.isDepartment() ? this.isSameDepartment(distWorkflowItem) : false;
            };
            DistributionOUWFItem.prototype.isRegOU = function () {
                return !!this.hasRegistry;
            };
            DistributionOUWFItem.prototype.setAction = function (action) {
                this.action = action;
                return this;
            }
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionOUWFItem', 'init', this);
        }
    })
};
