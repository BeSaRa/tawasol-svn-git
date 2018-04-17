module.exports = function (app) {
    app.factory('General', function (CMSModelInterceptor, 
                                     Correspondence,
                                     Indicator) {
        'ngInject';
        return function General(model) {
            var self = this;
            Correspondence.call(this);
            //self.docClassName = 'General';
            self.docStatus = 2 ; // by default

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            var indicator = new Indicator();
            General.prototype.getDocClassIndicator = function (docClass) {
                return indicator.getDocClassIndicator(docClass);
            };

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('General', 'init', this);
        }
    })
};