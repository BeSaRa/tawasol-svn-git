module.exports = function (app) {
    app.factory('EventHistoryCriteria', function (CMSModelInterceptor,
                                                  langService) {
        'ngInject';
        return function EventHistoryCriteria(model) {
            var self = this;
            self.docSubject = null;
            self.workflowActionId = null;
            self.documentStatusId = null;
            self.docFullSerial = null;
            /*self.sitesInfoTo = null;
            self.sitesInfoCC = null;*/
            self.sitesInfo = null;
            self.actionType = null;
            self.actionDate = null;
            self.userToId = null;
            self.docClassId = null;
            self.fromActionTime = null;
            self.toActionTime = null;
            self.userId = null;
            self.ouId = null;

            // temporary property. to be removed before sending to backend
            self.selectedSiteType = null;
            self.selectedMainSite = null;
            self.selectedSubSite = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            EventHistoryCriteria.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('EventHistoryCriteria', 'init', this);
        }
    })
};
