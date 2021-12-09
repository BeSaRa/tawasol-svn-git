module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _) {
        'ngInject';
        var modelName = 'SendProxy';
        var collectionToDelete = [
            'permissions',
            'organization',
            'ouList',
            'userOrganization'
        ];
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            _.map(collectionToDelete, function (key) {
                delete model.applicationUser[key];
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};