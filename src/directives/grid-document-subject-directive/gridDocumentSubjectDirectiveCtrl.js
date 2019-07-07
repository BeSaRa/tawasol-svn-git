module.exports = function (app) {
    app.controller('gridDocumentSubjectDirectiveCtrl', function (_) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridDocumentSubjectDirectiveCtrl';
        self.subject = '';
        self.tooltipSubject = '';

        self.getRecordText = function (forTooltip) {
            if (forTooltip && self.skipTooltip) {
                return '';
            }
            if (self.textValue) {
                return self.textValue;
            } else if (self.textProperty) {
                return _.get(self.record, self.textProperty);
            } else if (self.textCallback) {
                return self.record[self.textCallback]();
            } else if ('getSubject' in self.record) {
                return self.record.getSubject();
            } else if ('getTranslatedName' in self.record) {
                return self.record.getTranslatedName();
            }
            return '';

            /*if (forTooltip && self.skipTooltip) {
                self.tooltipSubject = '';
                return;
            }
            if (self.textValue) {
                self.subject = angular.copy(self.textValue);
                self.tooltipSubject = angular.copy(self.subject);
            } else if (self.textProperty) {
                self.subject = _.get(self.record, angular.copy(self.textProperty));
                self.tooltipSubject = angular.copy(self.subject);
            } else if (self.textCallback) {
                self.subject = self.record[self.textCallback]();
                self.tooltipSubject = angular.copy(self.subject);
            } else if ('getSubject' in self.record) {
                self.subject = self.record.getSubject();
                self.tooltipSubject = angular.copy(self.subject);
            } else if ('getTranslatedName' in self.record) {
                self.subject = self.record.getTranslatedName();
                self.tooltipSubject = angular.copy(self.subject);
            } else {
                self.subject = '';
                self.tooltipSubject = angular.copy(self.subject);
            }*/
        };

        self.subjectCallback = function ($event) {
            if (self.plainTextOnly)
                return false;

            if (self.clickCallback) {
                self.clickCallback(self.record, $event)
            }
        };
    });
};
