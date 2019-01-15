module.exports = function (app) {
    app.factory('FilterFactory', function (dialog, cmsTemplate) {
        'ngInject';
        var filterFactory = this;
        filterFactory.text = function () {

        };
        return function FilterFactory(title, model, options) {
            var self = this;
            self.model = model || {};
            self.options = options || null;
            self.title = title || null;


            FilterFactory.prototype.text = function (label, property) {
                return {label: label, property: property, type: 'text'}
            };

            FilterFactory.prototype.select = function (label, property, values) {
                return {label: label, property: property, type: 'select', values: values}
            };
            FilterFactory.prototype.switch = function (label, property, trueValue, falseValue) {
                return {label: label, property: property, type: 'switch', trueValue: trueValue, falseValue: falseValue}
            };

            FilterFactory.prototype.setOptions = function (options) {
                this.options = options;
            };

            FilterFactory.prototype.setModel = function (model) {
                self.model = model;
            };

            FilterFactory.prototype.filterController = function (title, model, options) {
                var Filter = this;
                Filter.filter = {};
                Filter.search = function () {
                    dialog.hide(Filter.filter);
                }
            };

            FilterFactory.prototype.openFilter = function (title, model, options) {
                var self = this;
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('filter-service'),
                        controller: self.filterController,
                        bindToController: true,
                        controllerAs: 'Filter',
                        locals: {
                            options: options || self.options,
                            title: title || self.title,
                            model: model || self.model
                        }
                    })
                    .then(function (filterModel) {
                        console.log(filterModel);
                        return self.model = filterModel;
                    });
            }
        }
    })
};
