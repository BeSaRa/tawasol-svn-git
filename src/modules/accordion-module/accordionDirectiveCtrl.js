module.exports = function (app) {
    app.controller('accordionDirectiveCtrl', function ($element, $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'accordionDirectiveCtrl';

        self.accordionItems = [];
        // scope of directive
        self.scope = $scope;

        self.titleScopes = [];
        /**
         * to add accordion item
         * @param item
         */
        self.addAccordionItem = function (item) {

        };

        self.getAccordionElementIndex = function (element) {
            var items = getElements(element[0].tagName);
            return Array.prototype.indexOf.call(items, element[0]);
        };

        self.toggleAccordionByIndex = function (index) {
            var elements = $element[0].querySelectorAll('accordion-content');
            var content = Array.prototype.slice.call(elements);
        };

        self.pushScopeTitle = function (scope) {
            self.titleScopes.push(scope);
        };

        function getElements(tagName) {
            if (tagName)
                tagName = tagName.toLowerCase();

            return $element[0].querySelectorAll(tagName || 'accordion-item');
        }
    });
};