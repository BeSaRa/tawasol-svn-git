module.exports = function (app) {
    app.factory('DistributionWFItem', function (CMSModelInterceptor, langService, distributionWFService) {
        'ngInject';
        return function DistributionWFItem(model) {
            var self = this;
            self.dueDate = null;
            self.action = null;
            self.escalationUser = null;
            self.escalationStatus = 0;
            self.comments = null;

            // delete it when send to service.
            self.arName = null;
            self.enName = null;
            self.relationId = null;
            self.gridName = null;

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
                this.dueDate = dueDate;
                return this;
            };
            DistributionWFItem.prototype.setAction = function (action) {
                this.action = action;
                return this;
            };
            DistributionWFItem.prototype.setEscalationUser = function (escalationUser) {
                this.escalationUser = escalationUser;
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
            DistributionWFItem.prototype.isUser = function () {
                return false;
            };
            DistributionWFItem.prototype.isDepartment = function () {
                return false;
            };
            DistributionWFItem.prototype.isGroup = function () {
                return false;
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
                return !!this.action;
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
                var icon = 'account';
                if (this.isDepartment()) {
                    icon = 'bank';
                } else if (this.isGroup()) {
                    icon = 'account-group'
                }
                return icon;
            };

            DistributionWFItem.prototype.getWorkflowItemType = function () {
                var title = 'user';
                if (this.isDepartment()) {
                    title = 'organization';
                } else if (this.isGroup()) {
                    title = 'workflow_group'
                }
                return title;
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

            DistributionWFItem.prototype.getCommentMessage = function () {
                return langService.get('select_comment');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWFItem', 'init', this);
        }
    })
};