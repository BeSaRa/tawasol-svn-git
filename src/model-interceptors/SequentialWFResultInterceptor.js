module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information) {
        'ngInject';
        var modelName = 'SequentialWFResult';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.nextStepInfo = model.nextStepInfo ? new Information(model.nextStepInfo) : null;
            return model;
        });

    })
};
