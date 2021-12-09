module.exports = function (app) {
    app.factory('DistributionWFItem', function (CMSModelInterceptor, langService, distributionWFService, gridService, generator) {
        'ngInject';
        return function DistributionWFItem(model) {
            var self = this;
            self.dueDate = null;
            self.action = null;
            self.escalationUserId = null;
            self.escalationStatus = null;
            self.escalationUserOUId = null;
            self.comments = null;
            self.sendSMS = false;
            self.sendEmail = false;
            self.regOuId = null;

            // delete it when send to service.
            self.arName = null;
            self.enName = null;
            self.relationId = null;
            self.gridName = null;

            self.selectedWFAction = null;
            self.actionSearchText = '';
            self.selectedWFComment = null;
            self.commentSearchText = '';
            self.tempRegOUSection = null;
            self.showCommentDropdown = false;
            self.forwardSenderActionAndComment = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionWFItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description toggle favorite workflow Item
             */
            DistributionWFItem.prototype.toggleFavorite = function () {
                var self = this;
                return distributionWFService
                    .toggleFavoriteWFItem(self, self.hasOwnProperty('toUserId') ? 'User' : 'Organization')
                    .then(function (result) {
                        self.relationId = result.action ? result.id : null;
                        return result;
                    });
            };
            DistributionWFItem.prototype.setRelationId = function (relationId) {
                this.relationId = relationId === -1 ? null : relationId;
                return this;
            };
            DistributionWFItem.prototype.isFavorite = function () {
                return this.relationId;
            };

            DistributionWFItem.prototype.setDueDate = function (dueDate) {
                this.dueDate = (this.getWorkflowItemType().toLowerCase() === 'groupmail') ? null : dueDate;
                return this;
            };
            DistributionWFItem.prototype.setAction = function (action) {
                this.action = action;
                return this;
            };
            DistributionWFItem.prototype.setSLADueDate = function (sLADueDate) {
                this.sLADueDate = sLADueDate || null;
                return this;
            };
            DistributionWFItem.prototype.clearWFActionSearchText = function () {
                this.actionSearchText = '';
                return this;
            };
            DistributionWFItem.prototype.setEscalationUser = function (escalationUser) {
                this.escalationUserId = escalationUser;
                return this;
            };
            DistributionWFItem.prototype.setEscalationUserOUId = function (escalationUser) {
                this.escalationUserOUId = escalationUser;
                return this;
            };
            DistributionWFItem.prototype.setEscalationStatus = function (escalationStatus) {
                this.escalationStatus = escalationStatus;
                return this;
            };
            DistributionWFItem.prototype.setComments = function (comments) {
                this.comments = comments && comments.hasOwnProperty('id') ? comments.comment : comments;
                return this;
            };
            DistributionWFItem.prototype.getComments = function () {
                return this.comments;
            };

            DistributionWFItem.prototype.setSendSMS = function (sendSMS) {
                this.sendSMS = sendSMS || false;
                return this;
            };
            DistributionWFItem.prototype.setSecureAction = function (isSecureAction) {
                this.isSecureAction = isSecureAction;
                return this;
            };
            DistributionWFItem.prototype.setSendRelatedDocs = function (isSendRelatedDocs) {
                this.sendRelatedDocs = isSendRelatedDocs;
                return this;
            };
            DistributionWFItem.prototype.setSendEmail = function (sendEmail) {
                this.sendEmail = sendEmail || false;
                return this;
            };
            DistributionWFItem.prototype.setRegOuId = function (regOuId) {
                this.regOuId = regOuId || null;
                return this;
            };
            DistributionWFItem.prototype.setTempRegOUSection = function (tempRegOUSection) {
                this.tempRegOUSection = tempRegOUSection;
                return this;
            };
            DistributionWFItem.prototype.setForwardSenderActionAndComment = function (forwardSenderActionAndComment) {
                this.forwardSenderActionAndComment = forwardSenderActionAndComment || false;
                return this;
            };
            DistributionWFItem.prototype.clearWFCommentSearchText = function () {
                this.commentSearchText = '';
                return this;
            };
            DistributionWFItem.prototype.isUser = function () {
                return false;
            };
            DistributionWFItem.prototype.isDepartment = function () {
                return false;
            };
            DistributionWFItem.prototype.isGroup = function () {
                return false;
            };
            DistributionWFItem.prototype.setId = function (id) {
                this.id = id || null;
                return this;
            };
            DistributionWFItem.prototype.setArName = function (arName) {
                this.arName = arName;
                return this;
            };
            DistributionWFItem.prototype.setEnName = function (enName) {
                this.enName = enName;
                return this;
            };
            DistributionWFItem.prototype.isWFComplete = function () {
                return (this.hasOwnProperty('isSecureAction') && this.isSecureAction) ? !!this.action && this.comments : !!this.action;
            };
            DistributionWFItem.prototype.isEscalationComplete = function (fromPredefined) {
                if (!this.escalationStatus || generator.getNormalizedValue(this.escalationStatus, 'lookupKey') === -1) {
                    return true;
                }
                var isComplete = fromPredefined ? !!this.sLADueDate : !!this.dueDate;
                if (this.isCustomEscalationStatusSelected()) {
                    isComplete = isComplete && !!this.escalationUserId;
                }
                return isComplete;
            };

            DistributionWFItem.prototype.setGridName = function (gridName) {
                this.gridName = gridName;
                return this;
            };
            DistributionWFItem.prototype.isSameWorkflowItem = function () {
                return false;
            };
            DistributionWFItem.prototype.getTranslatedKey = function () {
                return langService.current === 'ar' ? 'arName' : 'enName';
            };

            DistributionWFItem.prototype.getWorkflowItemIcon = function () {
                var icon = gridService.gridIcons.indicators.user;
                if (this.gridName === 'OUGroup') {
                    icon = gridService.gridIcons.indicators.groupMail;
                } else if (this.isDepartment()) {
                    icon = gridService.gridIcons.indicators.regOu;
                } else if (this.isGroup()) {
                    icon = gridService.gridIcons.indicators.workflowGroup;
                }
                return icon;
            };

            DistributionWFItem.prototype.getWorkflowItemIconTooltip = function () {
                var title = 'BulkSettings';
                if (this.gridName === 'OUGroup') {
                    title = 'group_mail';
                } else if (this.isDepartment()) {
                    title = 'organization';
                } else if (this.isGroup()) {
                    title = 'workflow_group'
                } else if (this.isUser()) {
                    title = 'user';
                }
                return title;
            };

            DistributionWFItem.prototype.getWorkflowItemType = function () {
                var type = '';
                if (this.gridName === 'OUGroup') {
                    type = 'groupMail';
                } else if (this.isDepartment()) {
                    type = 'organization';
                } else if (this.isGroup()) {
                    type = 'workflowGroup'
                } else if (this.isUser()) {
                    type = 'user';
                }
                return type;
            };

            DistributionWFItem.prototype.getActionMessage = function () {
                return langService.get('please_select_action');
            };

            DistributionWFItem.prototype.getFullNameByKey = function (langKey) {
                return this[langKey.toLowerCase() + 'Name'];
            };

            DistributionWFItem.prototype.getTranslatedName = function () {
                return this[langService.current + 'Name'];
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            DistributionWFItem.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            DistributionWFItem.prototype.getCommentMessage = function () {
                return langService.get('select_comment');
            };


            /**
             * @description check if custom escalation selected
             * @returns {boolean}
             */
            DistributionWFItem.prototype.isCustomEscalationStatusSelected = function () {
                return this.escalationStatus && this.escalationStatus.hasOwnProperty('lookupKey') && this.escalationStatus.lookupKey === 3;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWFItem', 'init', this);
        }
    })
};
