module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      ReferencePlanItemStartSerial,
                      ReferencePlanItem) {
        'ngInject';

        var modelName = 'ReferencePlanNumber';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.referencePlanItems = _.map(model.referencePlanItems, function (item) {
                item.retrieveItemComponent();
                delete item.components;
                delete item.expressionComponents;
                return item;
            });
            delete model.referencePlanItemStartSerialList;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.referencePlanItems = _.map(model.referencePlanItems, function (element) {
                var item = new ReferencePlanItem(element);
                item.fetchItemComponent();
                return item;
            });

            model.referencePlanItemStartSerialList = _.map(model.referencePlanItemStartSerialList, function (item) {
                return new ReferencePlanItemStartSerial(item);
            });
            return model;
        });

    })
};