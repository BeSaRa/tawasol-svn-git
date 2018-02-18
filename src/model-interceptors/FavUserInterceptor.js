module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'FavUser';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return {
                frequentUserId: model.toUserId,
                frequentUserOUID: model.appUserOUID
            };
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};