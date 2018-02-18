module.exports = function (app) {
    app.factory('DistributionOUWFItem', function (CMSModelInterceptor, langService, DistributionWFItem) {
        'ngInject';
        return function DistributionOUWFItem(model) {
            var self = this;
            DistributionWFItem.call(this);
            self.toOUId = null;
            self.originality = null;
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
            DistributionOUWFItem.prototype.isDepartment = function () {
                return true;
            };
            DistributionOUWFItem.prototype.mapFromWFOrganization = function (organization) {
                return this
                    .setRelationId(organization.relationId)
                    .setArName(organization.arName)
                    .setEnName(organization.enName)
                    .setToOUId(organization.id);
            };
            DistributionOUWFItem.prototype.setToOUId = function (toOUId) {
                this.toOUId = toOUId;
                return this;
            };
            DistributionOUWFItem.prototype.setOriginality = function (originality) {
                this.originality = originality;
                return this;
            };

            DistributionOUWFItem.prototype.isSameDepartment = function (workflowItem) {
                return this.toOUId === workflowItem.toOUId;
            };
            DistributionOUWFItem.prototype.mapSend = function () {
                // delete it when send to service.
                delete this.arName;
                delete this.enName;
                delete this.relationId;
                delete this.gridName;
                this.action = this.action.hasOwnProperty('id') ? this.action.id : this.action;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionOUWFItem', 'init', this);
        }
    })
};