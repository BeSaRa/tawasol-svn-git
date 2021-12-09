module.exports = function (app) {
    app.controller('classificationSelectorPopCtrl', function (_, langService, dialog, classificationService, excluded) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationSelectorPopCtrl';

        self.selectedClassifications = [];

        self.classification = null;

        self.selectedClassificationGrid = [];

        self.classifications = classificationService.classifications;

        self.grid = {
            limit: 10, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [10, 15, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.ouCorrespondenceSites.length + 21);
                }
            }]
        };

        // the excluded must be Classification Instance.
        self.excluded = _.map(excluded, 'id');


        self.excludeIfExists = function (classification) {
            return self.excluded.indexOf(classification.id) === -1;
        };

        self.includeIfEnabled = function(classification){
            return classification.status;
        };

        self.sendSelectedClassification = function () {
            dialog.hide(self.selectedClassifications);
        };

        self.addClassificationToSelectedClassification = function () {
            self.selectedClassifications = self.selectedClassifications.concat(self.classification);
            self.excluded = self.excluded.concat(_.map(self.classification, 'id'));
            self.classification = null;
            self.selectedClassificationGrid = [];
        };


        self.removeClassification = function (classification, doNotclear) {
            var classificationId = classification.id;
            self.excluded = _.filter(self.excluded, function (id) {
                return classificationId !== id;
            });
            self.selectedClassifications = _.filter(self.selectedClassifications, function (classification) {
                return classification.id !== classificationId;
            });
            if (!doNotclear)
                self.selectedClassificationGrid = [];
        };

        self.isDisabled = function () {
            return !self.classification;
        };

        self.removeSelectedClassification = function () {
            for (var i = 0; i < self.selectedClassificationGrid.length; i++) {
                self.removeClassification(self.selectedClassificationGrid[i], true);
            }
            self.selectedClassificationGrid = [];
        };


    });
};