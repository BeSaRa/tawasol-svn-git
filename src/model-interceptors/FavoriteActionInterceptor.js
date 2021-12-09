module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information) {
        'ngInject';
        var modelName = 'FavoriteAction';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionInfo = new Information(model.actionInfo);
            return model;
        });

    })
};
