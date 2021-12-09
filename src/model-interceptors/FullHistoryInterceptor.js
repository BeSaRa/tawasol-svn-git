module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      organizationService, 
                      applicationUserService, 
                      moment,
                      Information) {
        'ngInject';

        var modelName = 'FullHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.actionType_vts;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            (model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
            (model.updatedOn) ? getDateFromUnixTimeStamp(model, ["updatedOn"]) : "";
            model.actionByInfo = new Information(model.actionByInfo);
            model.actionTypeInfo = new Information(model.actionTypeInfo);
            model.actionByOUInfo = new Information(model.actionByOUInfo);
            model.actionToInfo = new Information(model.actionToInfo);
            model.actionType_vts = model.mapActionType();

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
