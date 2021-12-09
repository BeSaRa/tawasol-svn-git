/**
 * Created by USER on 15-May-17.
 */
module.exports = function (app) {
    app.directive('browseFileDirective', uploadFileDirective);

    function uploadFileDirective(toast, langService) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<input id="fileInput" type="file" class="ng-hide"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file">{{buttonLabel}}</md-button><md-input-container  md-no-float>    <input style="display: none" id="textInput"  type="text" placeholder="No file chosen" ng-readonly="true"></md-input-container>',
            link: apsUploadFileLink,
            scope: {
                callBack: '=',
                buttonLabel: '@',
                selectedFile: '=',
                modelObj :'=',
                selectedFileExtension: '='
            }
        };


        function apsUploadFileLink(scope, element) {
            var input = $(element[0].querySelector('#fileInput'));
            var button = $(element[0].querySelector('#uploadButton'));
            var textInput = $(element[0].querySelector('#textInput'));

            if (input.length && button.length && textInput.length) {
                button.click(function () {
                    input.click();
                });
                textInput.click(function () {
                    input.click();
                });
            }

            input.on('change', function (e) {
                var file = e.target.files[0];
                var _URL = window.URL || window.webkitURL;
                var img = new Image();
                img.src = _URL.createObjectURL(file);
                //scope.modelObj = img.src;
                img.onload = function () {
                        if (file) {
                            scope.selectedFile = file;
                            scope.callBack(file, scope.modelObj);
                        }

                };
                img.onerror = function () {
                    scope.callBack(file);
                }
            });
        }
    }

};