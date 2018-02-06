module.exports = function (app) {
    app.service('listGeneratorService', function () {
        'ngInject';
        var self = this,
            templates = {
                ul: angular.element('<ul />'),
                ol: angular.element('<ol />'),
                li: angular.element('<li />')
            };

        self.list = null;
        self.classes = 'list';


        self.createOrderList = function (classes) {
            return self.createList('ol', classes);
        };

        self.createUnOrderList = function (classes) {
            return self.createList('ul', classes);
        };

        self.createList = function (type, classes) {
            self.removeOldList();

            self.classes = classes || self.classes;
            self.list = angular.copy(templates[type]);
            return self;
        };

        self.addItemToList = function (data) {
            self.list.append((angular.copy(templates.li)).append(data));
            return self;
        };

        self.addClassToLastItem = function (className) {
            self.list.children().last().addClass(className);
            return self;
        };

        self.getList = function (DOM) {
            self.list.addClass(self.classes);
            return DOM ? self.list : self.list[0].outerHTML;
        };

        self.removeOldList = function () {
            self.list = null;
        }

    });
};