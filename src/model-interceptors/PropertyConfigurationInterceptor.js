module.exports = function (app) {
    app.run(function (CMSModelInterceptor, moment) {
        'ngInject';

        var modelName = 'PropertyConfiguration';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.dataType === "Date") {
                model['defaultValue'] = model['defaultValue'] ? moment(model['defaultValue'], "YYYY-MM-DD").valueOf() : null;
            }
            //delete model.localization;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            // if field is mandatory, it should be active by default
            model.status = model.isMandatory ? true : model.status;
            if (model.dataType === "Date") {
                if (model['defaultValue'] !== "0") {
                    model['defaultValue'] = model['defaultValue'] ? moment(Number(model['defaultValue'])).format('YYYY-MM-DD') : null;
                }
            }
            return model;
        });

    })
};