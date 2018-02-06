module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      moment) {
        'ngInject';
        var modelName = 'ContentViewHistoryEvents';
        
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.actionDate_vts;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            (model.actionDate_vts) = angular.copy(model.actionDate);
            model.actionDate_vts ? getDateFromUnixTimeStamp_Vts(model, ["actionDate_vts"]) : "";
            model.actionByInfo = new Information(model.actionByInfo);
            model.ouInfo = new Information(model.ouInfo);
            return model;
        });


        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD hh:mm:ss A)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp_Vts = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD hh:mm:ss A') : null;
            }
            return model;
        };
    })
};