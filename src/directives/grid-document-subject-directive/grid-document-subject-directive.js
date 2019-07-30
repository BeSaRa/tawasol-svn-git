module.exports = function (app) {
    app.directive('gridDocumentSubjectDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('grid-document-subject-template.html'),
            controller: 'gridDocumentSubjectDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                /**
                 * @description The record from which subject will be displayed
                 */
                record: '=',
                /**
                 * @description If passed, will display it as subject
                 */
                textValue: '@?',
                /**
                 * @description A property in given record which will return a subject to be displayed
                 */
                textProperty: '@?',
                /**
                 * @description A function to call which will return a subject from given record to be displayed
                 */
                textCallback: '@?',
                /**
                 * @description If passed, a plain text will be displayed instead of clickable subject
                 */
                plainTextOnly: '=?',
                /**
                 * @description If passed, tooltip will not be displayed on subject. By default, tooltip shows when hover on subject
                 */
                skipTooltip: '=?',
                /**
                 * @description If passed, subject will not be truncated. Be default, subject is truncated
                 */
                skipTruncate: '=?',
                /**
                 * @description If passed, subject will be truncated to this length. Otherwise, truncate will be done by max-width of subject column
                 */
                truncateLength: '=?',
                /**
                 * @description The callback when subject is clicked
                 */
                clickCallback: '=?'
            }
        }
    })
};
