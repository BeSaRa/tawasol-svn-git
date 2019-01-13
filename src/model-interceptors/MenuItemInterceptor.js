module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      $rootScope,
                      reportService,
                      sidebarService,
                      langService) {
        'ngInject';

        var modelName = 'MenuItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.translate = langService.get(model.lang_key);
            var report = reportService.getReportByKey(model.lang_key);

            if (model.hasOwnProperty('dynamicMenuItem')) {
                model.isDynamic = true;
                model.isReport = model.dynamicMenuItem.isTypeEqual('reports');
                model.state = model.dynamicMenuItem.generateState();
                if (model.isReport && model.parent === null) {
                    model.isReport = false;
                }
            }

            $rootScope.$watch(function () {
                return langService.current;
            }, function () {
                model.translate = langService.get(model.lang_key);
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (!model.parent) {
                model.parent = '';
            }
            model.myParent = angular.copy(sidebarService.getMenuItemByID(model.parent));
            return model;
        });
    })
};
