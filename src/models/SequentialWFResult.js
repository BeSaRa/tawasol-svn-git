module.exports = function (app) {
    app.factory('SequentialWFResult', function (CMSModelInterceptor,
                                                langService) {
        'ngInject';
        return function SequentialWFResult(model) {
            var self = this;
            self.isNextStepAuthorization = false;
            self.docClassId = null;
            self.nextStepInfo = null;
            self.isOpenedForApproval = false;
            self.isAdHoc = false;
            self.backwardSeqWF = false;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            SequentialWFResult.prototype.getSeqWFCurrentStepId = function () {
                return this.nextStepInfo ? this.nextStepInfo.id : null;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SequentialWFResult', 'init', this);
        }
    })
};
