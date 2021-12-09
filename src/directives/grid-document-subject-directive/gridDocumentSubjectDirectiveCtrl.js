module.exports = function (app) {
    app.controller('gridDocumentSubjectDirectiveCtrl', function (_) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridDocumentSubjectDirectiveCtrl';
        self.subject = '';
        self.tooltipSubject = '';

        self.getRecordText = function (forTooltip) {
            /*if (forTooltip && self.skipTooltip) {
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
            return '';*/

            var subject = '', tooltip = '';
            if (self.textValue) {
                subject = angular.copy(self.textValue);
                tooltip = angular.copy(subject);
            } else if (self.textProperty) {
                subject = _.get(self.record, angular.copy(self.textProperty));
                tooltip = angular.copy(subject);
            } else if (self.textCallback) {
                subject = self.record[self.textCallback]();
                tooltip = angular.copy(subject);
            } else if ('getSubject' in self.record) {
                subject = self.record.getSubject();
                tooltip = angular.copy(subject);
            } else if ('getTranslatedName' in self.record) {
                subject = self.record.getTranslatedName();
                tooltip = angular.copy(subject);
            } else {
                subject = '';
                tooltip = angular.copy(subject);
            }
            self.subject = subject;
            if (subject){
                if (!self.skipTruncate && self.truncateLength){
                    self.subject = _.truncate(subject, {'length': self.truncateLength, 'separator': ' '});
                }
            }
            self.tooltipSubject = self.skipTooltip ? '' : tooltip;
            if (forTooltip) {
                return self.tooltipSubject;
            } else {
               return self.subject;
            }
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
