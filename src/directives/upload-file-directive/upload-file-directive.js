/**
 * Created by USER on 15-May-17.
 */
module.exports = function (app) {
    app.directive('uploadFileDirective', uploadFileDirective);

    function uploadFileDirective(toast, langService, dialog, _, generator) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<input id="fileInput" type="file" class="ng-hide" name="{{modelName}}"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file">{{buttonLabel}}</md-button><md-input-container  md-no-float>    <input style="display: none" id="textInput" ng-model="fileName" type="text" placeholder="No file chosen" ng-readonly="true"></md-input-container>',
            link: apsUploadFileLink,
            scope: {
                callBack: '=',
                modelName: '@',
                buttonLabel: '@',
                selectedFile: '=',
                modelObj: '=',
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
                if (!file) {
                    return;
                }

                var fileExt = generator.getFileExtension(file, true);
                var isValidFileExtension = _.find(scope.selectedFileExtension, function (validExt) {
                    return validExt === fileExt;
                });

                if (!isValidFileExtension) {
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(scope.selectedFileExtension.join(', ')));
                    input.val('');
                    return false;
                }

                var _URL = window.URL || window.webkitURL;
                var img = new Image();
                img.src = _URL.createObjectURL(file);
                img.onload = function () {
                    var fieldName = input[0].name;
                    if (fieldName === 'loginLogo' || fieldName === 'bannerLogo' || fieldName === 'organizationLogo') { //fieldName === 'signatureImage'
                        if (!_checkValidDimensions(this, 283, 283)) {
                            input.val('');
                            return false;
                        }
                    }

                    if (scope.modelObj) {
                        scope.selectedFile = scope.modelObj;
                    } else {
                        scope.selectedFile = file;
                    }

                    scope.callBack(file, scope.modelName);

                };
            });
        }

        function _checkValidDimensions(file, allowedWidth, allowedHeight) {
            var width = file.naturalWidth || file.width;
            var height = file.naturalHeight || file.height;
            if (width > allowedWidth || height > allowedHeight) {
                toast.error(langService.get('image_dimensions_info').change({
                    width: allowedWidth,
                    height: allowedHeight
                }));
                return false;
            }
            return true;
        }
    }

};
