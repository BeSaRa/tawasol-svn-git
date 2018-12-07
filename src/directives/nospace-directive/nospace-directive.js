module.exports = function (app) {
    /**
     * @description Prevents to enter space in field
     */
    app.directive('noSpaceDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $element.bind('input', function () {
                    $(this).val($(this).val().replace(/ /g, ''));
                });
            }
        }
    }).directive('noEnterDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $element.bind('input', function () {
                    $(this).val($(this).val().replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "\r\n"));
                });
            }
        }
    }).directive('ngAutoCompleteOff', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $element.bind('input', function () {
                    $(this).attr('autocomplete', 'off');
                });
            }
        }

    })
};