module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Information) {
        'ngInject';

        var modelName = 'MinistryAssistant';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.userInfo = new Information(model.userInfo);
            model.ouInfo = new Information(model.ouInfo);

            return model;
        });
    })
};
