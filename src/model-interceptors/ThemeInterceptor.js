module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      lookupService, 
                      _, 
                      langService) {
        'ngInject';

        var modelName = 'Theme';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            var themeKeys = angular.copy(lookupService.returnLookups(lookupService.themeKey));
            model.themeKeys = _.map(themeKeys, function (lookup) {
                lookup.parent = _.find(model.properties, function (property) {
                    return property.propertyKey === lookup.id;
                });
                return lookup;
            });
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var properties = [];
            _.filter(_.map(model.themeKeys, function (lookup) {
                if (lookup.parent) {
                    var property = {
                        propertyKey: lookup.id,
                        propertyValue: lookup.parent.propertyValue
                    };
                    properties.push(property);
                }
                return lookup.parent;
            }), function (parent) {
                return parent;
            });
            model.properties = properties;
            if (model.colors.length > 0) {
                if (model.copy) {
                    for (var i in model.colors) {
                        delete model.colors[i].id;
                    }
                    delete model.copy;
                }
            }
            delete model.themeKeys;
            delete model.theme;
            delete model.arStatus;
            delete model.enStatus;
            return model;
        });
        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var themeKeys = angular.copy(lookupService.returnLookups(lookupService.themeKey));
            model.themeKeys = _.map(themeKeys, function (lookup) {
                lookup.parent = _.find(model.properties, function (property) {
                    return property.propertyKey === lookup.id;
                });
                return lookup;
            });
            model.arStatus = model.status ? langService.getKey('active', 'ar') : langService.getKey('inactive', 'ar');
            model.enStatus = model.status ? langService.getKey('active', 'en') : langService.getKey('inactive', 'en');
            model.mapReceived();

            return model;
        });

    })
};