module.exports = function (app) {
    app.factory('PredefinedActionMember', function (CMSModelInterceptor,
                                                    langService) {
        'ngInject';
        return function PredefinedActionMember(model) {
            var self = this,
                actionTypeMap = {
                    user: 0,
                    groupMail: 1, //groupMail
                    organization: 2, // regOu
                },
                reverseActionTypeMap = {
                    0: 'user',
                    1: 'groupMail',
                    2: 'organization',
                };
            self.id = null;
            self.toUserId = null;
            self.toOUID = null;
            self.actionId = null;
            self.sLADueDate = null;
            self.actionType = null;
            self.sendSMS = true;
            self.sendEmail = true;
            self.userComment = null;
            self.secureComment = false;
            self.sendRelatedDocs = false;
            self.escalationStatus = null;
            self.escalationUserId = null;
            self.escalationUserOUId = null;

            if (model)
                angular.extend(this, model);

            PredefinedActionMember.prototype.setId = function (id) {
                this.id = id || null;
                return this;
            };
            PredefinedActionMember.prototype.setToUserId = function (toUserId) {
                this.toUserId = toUserId || null;
                return this;
            };
            PredefinedActionMember.prototype.setToOUID = function (toOUID) {
                this.toOUID = toOUID || null;
                return this;
            };
            PredefinedActionMember.prototype.setActionId = function (actionId) {
                this.actionId = actionId;
                return this;
            };
            PredefinedActionMember.prototype.setSLADueDate = function (sLADueDate) {
                this.sLADueDate = sLADueDate || null;
                return this;
            };
            PredefinedActionMember.prototype.setActionType = function (actionType) {
                this.actionType = actionType;
                if (actionType !== null && typeof actionType !== 'undefined' && angular.isString(actionType)) {
                    this.actionType = _mapActionType(actionType);
                }
                return this;
            };
            PredefinedActionMember.prototype.setSendSMS = function (isSendSMS) {
                this.sendSMS = isSendSMS || false;
                return this;
            };
            PredefinedActionMember.prototype.setSendEmail = function (isSendEmail) {
                this.sendEmail = isSendEmail || false;
                return this;
            };
            PredefinedActionMember.prototype.setUserComment = function (comments) {
                this.userComment = comments && comments.hasOwnProperty('id') ? comments.comment : comments;
                return this;
            };
            PredefinedActionMember.prototype.setSecureComment = function (isSecureComment) {
                this.secureComment = isSecureComment || false;
                return this;
            };
            PredefinedActionMember.prototype.setSendRelatedDocs = function (isSendRelatedDocs) {
                this.sendRelatedDocs = isSendRelatedDocs || false;
                return this;
            };
            PredefinedActionMember.prototype.setEscalationStatus = function (escalationStatus) {
                this.escalationStatus = escalationStatus || null;
                return this;
            };
            PredefinedActionMember.prototype.setEscalationUser = function (escalationUser) {
                this.escalationUserId = escalationUser || null;
                return this;
            };
            PredefinedActionMember.prototype.setEscalationUserOUId = function (escalationUser) {
                this.escalationUserOUId = escalationUser || null;
                return this;
            };

            PredefinedActionMember.prototype.getActionType = function (needStringValue) {
                return (needStringValue ? _mapReverseActionType(this.actionType) : this.actionType);
            };

            PredefinedActionMember.prototype.isUserMember = function () {
                return this.actionType === actionTypeMap.user;
            };

            PredefinedActionMember.prototype.isGroupMailMember = function () {
                return this.actionType === actionTypeMap.groupMail;
            };

            PredefinedActionMember.prototype.isOrganizationMember = function () {
                return this.actionType === actionTypeMap.organization;
            };

            function _mapActionType(actionType) {
                return actionTypeMap[actionType];
            }

            function _mapReverseActionType(actionType) {
                return reverseActionTypeMap[actionType];
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PredefinedActionMember', 'init', this);
        }
    })
};
