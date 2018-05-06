module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      Information) {
        'ngInject';
        var modelName = 'MailNotification';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionInfo = new Information(model.actionInfo);
            model.senderInfo = new Information(model.senderInfo);
            getDateFromUnixTimeStamp(model, ["receivedDate"]);
            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD') : null;
            }
            return model;
        };

    })
};