module.exports = function (app) {
    require('./attachment-style-directive.scss');
    app.directive('attachmentViewerDirective', function ($compile, thumbnailService, $timeout) {
        'ngInject';
        return {
            restrict: 'A',
            controller: 'attachmentViewerDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                image: '=attachmentViewerDirective'
            },
            link: function (scope, element, attrs, ctrl) {
                var self = ctrl;
                var prefix = 'thumbnail-container';
                var image = ctrl.image;

                function getVsId(escape) {
                    return image.vsId.replace(escape ? '{' : '', '').replace(escape ? '}' : '', '');
                }

                function getElementName(escape) {
                    return prefix + getVsId(escape);
                }

                function getElement() {
                    return angular.element('#' + getElementName(true));
                }

                function getWindow(property) {
                    return angular.element(window)[property]();
                }


                function applyLeft($event) {
                    var ww = getWindow('width'),
                        xw = $event.pageX + getElement().width(),
                        isOverflow = xw > ww,
                        overFlowPixels = isOverflow ? xw - ww : 0;
                    return isOverflow ? ($event.pageX - (getElement().width() + 10)) : ($event.pageX + 10);
                }

                function applyTop($event) {
                    var wh = getWindow('height'),
                        yh = $event.pageY + getElement().height(),
                        isOverflow = yh > wh,
                        overflowPixels = isOverflow ? yh - wh : 0;
                    return isOverflow ? ($event.pageY - (overflowPixels + 10)) : $event.pageY;
                }

                function updateElementPosition($event) {
                    getElement().css({
                        left: applyLeft($event),
                        top: applyTop($event)
                    });
                }


                function createThumbnailViewer($event) {
                    var div = angular.element('<div />', {
                        id: getElementName(true),
                        class: 'thumbnail-container-popup-hover',
                        layout: 'row',
                        'layout-align': 'center center'
                    });
                    div.append(angular.element('<div layout="row" class="thumbnail-wrapper" flex><a ng-click="ctrl.preventClick($event)" class="thumbnail-item"><img src="{{ctrl.image.url}}"></a></div>'));

                    angular.element('body').append($compile(div)(scope));
                }

                function removeThumbnailViewer() {
                    getElement().remove();
                }


                element.on('mouseenter', function ($event) {
                    createThumbnailViewer($event);
                });

                element.on('mousemove', function ($event) {
                    updateElementPosition($event);
                });

                element.on('mouseleave', function ($event) {
                    removeThumbnailViewer();
                });

            }
        }
    })
};