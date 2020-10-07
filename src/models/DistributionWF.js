module.exports = function (app) {
    app.factory('DistributionWF', function (CMSModelInterceptor,
                                            util,
                                            DistributionWFItem,
                                            DistributionOUWFItem,
                                            DistributionGroupWFItem,
                                            DistributionUserWFItem) {
        'ngInject';
        util.inherits(DistributionOUWFItem, DistributionWFItem);
        util.inherits(DistributionGroupWFItem, DistributionWFItem);
        util.inherits(DistributionUserWFItem, DistributionWFItem);

        return function DistributionWF(model) {
            var self = this;
            self.normalUsers = [];
            self.managerUsers = [];
            self.wfGroups = [];
            self.favouriteUsers = [];
            self.userWfGroups = [];
            self.receivedOUs = [];
            self.receivedRegOUs = [];
            self.isSeqWFLaunch = false;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DistributionWF.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DistributionWF.prototype.setNormalUsers = function (normalUsers) {
                this.normalUsers = normalUsers;
                return this;
            };
            DistributionWF.prototype.setManagerUsers = function (managerUsers) {
                this.managerUsers = managerUsers;
                return this;
            };
            DistributionWF.prototype.setWfGroups = function (wfGroups) {
                this.wfGroups = wfGroups;
                return this;
            };
            DistributionWF.prototype.setFavouriteUsers = function (favouriteUsers) {
                this.favouriteUsers = favouriteUsers;
                return this;
            };
            DistributionWF.prototype.setUserWfGroups = function (userWfGroups) {
                this.userWfGroups = userWfGroups;
                return this;
            };
            DistributionWF.prototype.setReceivedOUs = function (receivedOUs) {
                this.receivedOUs = receivedOUs;
                return this;
            };
            DistributionWF.prototype.setReceivedRegOUs = function (receivedRegOUs) {
                this.receivedRegOUs = receivedRegOUs;
                return this;
            };

            DistributionWF.prototype.setIsSeqWFLaunch = function (isSeqWFLaunch) {
                this.isSeqWFLaunch = isSeqWFLaunch;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWF', 'init', this);
        }
    })
};
