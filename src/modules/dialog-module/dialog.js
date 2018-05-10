module.exports = function (app) {
    app.service('dialog', function ($mdDialog, cmsTemplate, $q, $sce, langService, $rootScope) {
        'ngInject';
        var self = this;

        /**
         * small function to get template for current special-dialog
         * @param type
         * @returns {Object}
         */
        function getTemplate(type) {
            var template = require('./templates/' + type + '.html');
            return template.replace(/..\/..\/..\/..\/assets/g,'assets');
        }

        /**
         * function to prepare dialog before show
         * @param type
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param hideIcon
         * @returns {{template: Object, controller: dialog.controller, locals: {content: *, cancelButton: *, acceptButton: *}, targetEvent: (*|boolean), escapeToClose: (*|boolean), controllerAs: string, bindToController: boolean, multiple: boolean}}
         */
        function prepareDialog(type, content, cancelButton, escapeToCancel, event, hideIcon) {
            // if just confirm content, acceptButton, rejectButton, escapeToCancel, event
            content = $sce.trustAsHtml(content);
            return {
                template: getTemplate(type),
                controller: function ($mdDialog) {
                    'ngInject';
                    var self = this;
                    self.hide = function () {
                        $mdDialog.hide();
                    };
                    self.cancel = function () {
                        $mdDialog.cancel();
                    };
                    self.accept = function () {
                        $mdDialog.hide();
                    }
                },
                locals: {
                    content: content,
                    cancelButton: cancelButton || (type !== 'confirm' ? langService.get('close') : langService.get('no')),
                    acceptButton: escapeToCancel || langService.get('yes'),
                    hideIcon: hideIcon || false
                },
                targetEvent: event || false,
                escapeToClose: escapeToCancel || false,
                controllerAs: 'ctrl',
                bindToController: true,
                multiple: true
            }
        }

        /**
         * alert dialog
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @returns {promise}
         */
        self.alertMessage = function (content, cancelButton, escapeToCancel, event) {
            var dialog = prepareDialog('alert', content, cancelButton, escapeToCancel, event);
            return $mdDialog.show(dialog);
        };
        /**
         * success dialog
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param hideIcon
         * @returns {promise}
         */
        self.successMessage = function (content, cancelButton, escapeToCancel, event, hideIcon) {
            var dialog = prepareDialog('success', content, cancelButton, escapeToCancel, event, hideIcon);
            return $mdDialog.show(dialog);
        };
        /**
         * error dialog
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @returns {promise}
         */
        self.errorMessage = function (content, cancelButton, escapeToCancel, event) {
            var dialog = prepareDialog('error', content, cancelButton, escapeToCancel, event);
            return $mdDialog.show(dialog);
        };
        /**
         * info message
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @return {promise}
         */
        self.infoMessage = function (content, cancelButton, escapeToCancel, event) {
            var dialog = prepareDialog('info', content, cancelButton, escapeToCancel, event);
            return $mdDialog.show(dialog);
        };
        /**
         * confirm dialog
         * @param content
         * @param acceptButton
         * @param rejectButton
         * @param event
         * @returns {promise}
         */
        self.confirmMessage = function (content, acceptButton, rejectButton, event) {
            var dialog = prepareDialog('confirm', content, acceptButton, rejectButton, event);
            return $mdDialog.show(dialog);
        };
        /**
         * show custom template dialog
         * @param options
         * @returns {promise}
         */
        self.showDialog = function (options) {
            // workaround to add lang in the scope
            options.scope = options.scope ? options.scope : $rootScope.$new(false);
            options.multiple = true;
            if (options.hasOwnProperty('escapeToCancel')) {
                options.escapeToClose = options.escapeToCancel;
            }
            return $mdDialog.show(options);
        };
        /**
         * to hide last dialog or specific dialog
         * @param resolvedValue
         * @returns {*}
         */
        self.hide = function (resolvedValue) {
            return $mdDialog.hide.apply(this, arguments);
        };
        /**
         * to cancel last dialog or specific dialog
         * @param reason
         * @returns {*}
         */
        self.cancel = function (reason) {
            return $mdDialog.cancel.apply(this, arguments);
        };
        /**
         * render popup for error validation
         * @param title => must be lang key to render
         * @param content
         * @return {*}
         */
        self.validationErrorMessage = function (title, content) {
            var titleTemplate = angular.element('<span class="validation-title">' + title + '</span> <br/>');
            if (!content || !title)
                return $q.reject("NO TITLE or content found");

            if (title)
                titleTemplate.html(title);

            titleTemplate.append(content);
            return self.errorMessage(titleTemplate.html());
        }


        /**
         * show a prompt dialog
         * @param event
         * @param text
         * @param event
         * @param placeHolder
         * @return user input
         */
        self.showPrompt = function(ev,title,text,placeHolder) {

            var confirm = $mdDialog.prompt()
                .title(title)
                .textContent(text)
                .placeholder(placeHolder)
                .targetEvent(ev)
                .required(true)
                .ok('Ok')
                .cancel('Cancel');

            return $mdDialog.show(confirm).then(function (result) {
                return result;
            });

        };


    });
};