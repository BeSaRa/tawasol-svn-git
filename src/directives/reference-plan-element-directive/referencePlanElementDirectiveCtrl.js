module.exports = function (app) {
    app.controller('referencePlanElementDirectiveCtrl', function (lookupService,
                                                                  referencePlanNumberService,
                                                                  $q,
                                                                  _,
                                                                  langService,
                                                                  $scope,
                                                                  $compile,
                                                                  $rootScope,
                                                                  $timeout,
                                                                  Lookup,
                                                                  $element) {
        'ngInject';
        var self = this;
        self.controllerName = 'referencePlanElementDirectiveCtrl';
        // all reference plan items
        var items = angular.copy(lookupService.returnLookups(lookupService.refrenceNumberPlanElement));
        items.push(new Lookup({
            lookupStrKey: '',
            defaultArName: langService.getKey('static_text', 'ar'),
            defaultEnName: langService.getKey('static_text', 'en'),
            lookupKey: 'SEPARATOR'
        }));

        self.referenceElements = _.chunk(items, 4);
        // item wrapper
        self.elementsWrapper = $element.find('#elements');

        self.patternWrapper = $element.find('#reference-pattern');

        referencePlanNumberService.referencePlanItemsScopes;

        $scope.lang = langService.getCurrentTranslate();

        self.elementNotExists = function (elementItem) {
            var ids = _.map(self.referenceItem.components, 'id');
            return !elementItem.id || ids.indexOf(elementItem.id) === -1;
        };

        self.createElementItem = function (elementItem) {
            var scopes = referencePlanNumberService.referencePlanItemsScopes;
            var scope = scopes[elementItem.id] || $rootScope.$new();
            if (!scope.elementItem) {
                scope.elementItem = elementItem;
                referencePlanNumberService.pushScope(scope);
            }
            scope.ctrl = self;
            var element = angular.element('<div  ng-if="ctrl.elementNotExists(elementItem)" element-draggable-directive class="reference-element-item {{!elementItem.id ? \'element-separator\' : \'\'}}">\n    <span>{{elementItem.getTranslatedName()}}</span>\n    <span>\n    <md-button class="md-icon-button" ng-click="ctrl.appendElementToComponents(elementItem)">\n        <md-icon md-svg-icon="plus"></md-icon>\n    </md-button>\n    </span>\n</div>');
            return $compile(element)(scope);
        };

        self.appendElementToComponents = function (elementItem) {
            self.referenceItem.components.push(elementItem);
            $(self.patternWrapper).append(referencePlanNumberService.createElementComponent(elementItem, self, $compile, $rootScope));
        };

        self.updateCurrentItemComponents = function (components) {
            self.referenceItem.setComponents(components);
        };

        self.renderElementItems = function () {
            self.elementsWrapper.empty();
            _.map(self.referenceElements, function (chunk) {
                var row = angular.element('<div layout="row"></div>');
                $(self.elementsWrapper).append(row);
                _.map(chunk, function (elementItem) {
                    $(row).append(self.createElementItem(elementItem))
                });
            });
        };

        self.addStaticTextElement = function (elementItem) {
            self.elementsWrapper.children().last().append(self.createElementItem(elementItem));
        };

        self.renderElementComponents = function () {
            self.patternWrapper.empty();
            _.map(self.referenceItem.components, function (element) {
                $(self.patternWrapper).append(referencePlanNumberService.createElementComponent(element, self, $compile, $rootScope));
            });
        };

        self.removeReferenceElement = function (elementItem, $event) {
            angular.element($event.target).parents('.component-element').remove();
            self.referenceItem.components.splice(self.referenceItem.components.indexOf(elementItem), 1);
            self.renderElementItems();
        };

        self.editStaticTextOn = function (element) {
            element.editMode = true;
        };
        self.editStaticTextOff = function (element) {
            element.editMode = false;
        };

        self.editStaticTextOffWhenEnter = function (element, $event) {
            var code = $event.keyCode || $event.which;
            if (code !== 13)
                return;
            element.editMode = false;
        };

        $timeout(function () {
            self.renderElementItems();
            self.renderElementComponents();
        });


    });
};