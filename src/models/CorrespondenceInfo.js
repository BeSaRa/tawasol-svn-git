module.exports = function (app) {
    app.factory('CorrespondenceInfo', function (CMSModelInterceptor) {
        'ngInject';
        return function CorrespondenceInfo(model) {
            var self = this;
            self.documentClass = null;
            self.vsId = null;
            self.workFlow = null;
            self.wobNumber = null;
            self.title = null;
            self.isPaper = null;
            self.docStatus = null;
            self.docFullSerial = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            CorrespondenceInfo.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @name CorrespondenceInfo.isWorkItem
             * @kind function
             * @description to check if the correspondence workItem or not.
             * @returns {boolean}
             */
            CorrespondenceInfo.prototype.isWorkItem = function () {
                return !!this.wobNumber;
            };
            /**
             * to check if the document need to approve
             * @returns {boolean}
             */
            CorrespondenceInfo.prototype.needToApprove = function () {
                return (this.documentClass.toLowerCase() !== 'incoming') && (this.docStatus < 24)
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CorrespondenceInfo', 'init', this);
        }
    })
};