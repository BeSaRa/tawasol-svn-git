module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information) {
        'ngInject';
        var modelName = 'WFUser';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.checked;
            delete model.ouUSerId;
            delete model.ouInfo;
            delete model.userInfo;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.checked = false;
            model.ouUSerId = Number(model.ouId + '' + model.id);
            model.ouInfo = new Information({
                arName: model.ouArName,
                enName: model.ouEnName,
                id: model.ouId
            });
            model.userInfo = new Information({
                arName: model.arName,
                enName: model.enName,
                id: model.id
            });
            return model;
        });

    })
};
