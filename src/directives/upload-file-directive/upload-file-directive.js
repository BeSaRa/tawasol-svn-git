/**
 * Created by USER on 15-May-17.
 */
module.exports = function (app) {
    app.directive('uploadFileDirective', uploadFileDirective);

    function uploadFileDirective(toast, langService) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<input id="fileInput" type="file" class="ng-hide"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file">{{buttonLabel}}</md-button><md-input-container  md-no-float>    <input style="display: none" id="textInput" ng-model="fileName" type="text" placeholder="No file chosen" ng-readonly="true"></md-input-container>',
            link: apsUploadFileLink,
            scope: {
                callBack: '=',
                modelName: '@',
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
                img.onload = function () {
                    var width  = this.naturalWidth  || this.width;
                    var height = this.naturalHeight || this.height;
                    if(width > 283 && height > 283){
                        toast.error(langService.get('image_dimension_greater'));
                        input.val('');
                    }
                    else{
                        if (file) {

                            if (scope.selectedFileExtension) {
                                if (scope.selectedFileExtension.length > 0) {
                                    var fileExt = file.name.split('.').pop();

                                    var isValidFileExtension = scope.selectedFileExtension.filter(function (validExt) {
                                        return validExt === fileExt;
                                    })[0];

                                    if (!isValidFileExtension) {
                                        //toastService.error(langService.lang.invalid_file_upload);
                                        return false;
                                    }
                                }
                            }
                            if(scope.modelObj){
                                scope.selectedFile = scope.modelObj;
                            }
                            else{
                                scope.selectedFile = file;
                            }

                            scope.callBack(file, scope.modelName);
                        }
                    }
                };
            });
        }
    }

};