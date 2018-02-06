module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      organizationService, 
                      applicationUserService, 
                      moment, 
                      lookupService) {
        'ngInject';

        var modelName = 'LinkedAttachment';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
         (model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD hh:mm:ss A)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD hh:mm:ss A') : null;
            }
            return model;
        };
    })
};