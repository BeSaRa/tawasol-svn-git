module.exports = function (app) {
    app.factory('DistributionGroupWFItem', function (CMSModelInterceptor, DistributionWFItem) {
        'ngInject';
        return function DistributionGroupWFItem(model) {
            var self = this;
            DistributionWFItem.call(this);
            self.wfGroupId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

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
            DistributionGroupWFItem.prototype.mapFromWFGroup = function (workflowGroup) {
                return this
                    .setArName(workflowGroup.arName)
                    .setEnName(workflowGroup.enName)
                    .setWfGroupId(workflowGroup.id)
                    .setSendSMS(workflowGroup.sendSMS)
                    .setSendSMS(workflowGroup.sendEmail);
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
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionGroupWFItem', 'init', this);
        }
    })
};