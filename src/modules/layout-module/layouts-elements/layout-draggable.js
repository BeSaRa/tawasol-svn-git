module.exports = function (app) {
    app.directive('layoutDraggable', function ($timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $timeout(function () {
                    $(element)
                        .draggable({
                            handle: attrs.layoutDraggable ? attrs.layoutDraggable : 'label',
                            revert: 'invalid',
                            helper: 'clone',
                            appendTo: 'body',
                            start: function (event, ui) {
                                ui.helper
                                    .css('z-index', 1000);
                                if (!attrs.layoutDraggable) {
                                    console.log('ui.helper.data()', ui.helper.data());
                                    ui.helper
                                        .children(':not(label)')
                                        .remove()
                                        .end()
                                        .addClass('box');
                                } else {
                                    var image = ui.helper
                                        .find('img')
                                        .remove();
                                    ui.helper.children().remove().end().append(image);
                                }

                            }
                        });
                }, 1000);


            }
        }
    })
};