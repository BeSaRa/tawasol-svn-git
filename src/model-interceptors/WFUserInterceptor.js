module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator) {
        'ngInject';
        var modelName = 'WFUser';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.ouUSerId;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouUSerId = Number(model.ouId + '' + model.id);
            return model;
        });

    })
};
