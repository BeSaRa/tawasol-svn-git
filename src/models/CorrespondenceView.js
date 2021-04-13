module.exports = function (app) {
    app.factory('CorrespondenceView', function (CMSModelInterceptor, Correspondence) {
        'ngInject';
        return function CorrespondenceView(model) {
            var self = this;
            Correspondence.call(this);
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CorrespondenceView', 'init', this);
        }
    })
};
