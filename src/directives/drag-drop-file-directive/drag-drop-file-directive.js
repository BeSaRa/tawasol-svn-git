module.exports = function (app) {
    app.directive('dragDropFileDirective', function () {
        'ngInject';
            return {
                restrict: 'E',
                replace: true,
                //require: '?ngModel',
                template: '<div class="asset-upload not-found">Drag here to upload</div>',
                scope: {
                    single: "=",
                    getSelectedFilesFn: '='
                },
                /*compile: function (element, attrs) {
                 if (!attrs.single) {
                 attrs.$set("single", false);
                 }
                 },*/
                link: function (scope, element, attrs, ngModel) {
                    element.on('dragover', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    element.on('dragenter', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    element.on('drop', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.originalEvent.dataTransfer) {
                            if (e.originalEvent.dataTransfer.files.length > 0) {
                                scope.getSelectedFilesFn(e.originalEvent.dataTransfer.files[0]);
                            }
                        }
                        return false;
                    });

                }
            }
        }
    )
};