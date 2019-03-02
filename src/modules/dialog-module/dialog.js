module.exports = function (app) {
    app.service('dialog', function ($mdDialog, cmsTemplate, $q, $sce, langService, $rootScope) {
        'ngInject';
        var self = this;
        var events = "href onabort onauxclick onbeforecopy onbeforecut onbeforepaste onblur oncancel oncanplay oncanplaythrough onchange onclick onclose oncontextmenu oncopy oncuechange oncut ondblclick ondrag ondragend ondragenter ondragleave ondragover ondragstart ondrop ondurationchange onemptied onended onerror onfocus onfullscreenchange onfullscreenerror ongotpointercapture oninput oninvalid onkeydown onkeypress onkeyup onload onloadeddata onloadedmetadata onloadstart onlostpointercapture onmousedown onmouseenter onmouseleave onmousemove onmouseout onmouseover onmouseup onmousewheel onpaste onpause onplay onplaying onpointercancel onpointerdown onpointerenter onpointerleave onpointermove onpointerout onpointerover onpointerup onprogress onratechange onreset onresize onscroll onsearch onseeked onseeking onselect onselectionchange onselectstart onstalled onsubmit onsuspend ontimeupdate ontoggle onvolumechange onwaiting onwebkitfullscreenchange onwebkitfullscreenerror onwheel";

        function stripEvents(element) {
            angular
                .element(element)
                .removeAttr(events);

            angular.element(element).children().each(function () {
                stripEvents(angular.element(this));
            });
        }

        /**
         * strip the HTML content from <script> tags.
         * @param s
         * @return {string}
         */
        function stripScripts(s) {
            var div = document.createElement('div');
            div.innerHTML = s;
            var scripts = div.getElementsByTagName('script');
            var i = scripts.length;
            while (i--) {
                scripts[i].parentNode.removeChild(scripts[i]);
            }
            stripEvents(div);
            return div.innerHTML;
        }

        /**
         * small function to get template for current special-dialog
         * @param type
         * @returns {Object}
         */
        function getTemplate(type) {
            var template = require('./templates/' + type + '.html');
            return template.replace(/..\/..\/..\/..\/assets/g, 'assets');
        }

        /**
         * function to prepare dialog before show
         * @param type
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param hideIcon
         * @param avoidStripEvent
         * @returns {{template: Object, controller: dialog.controller, locals: {content: *, cancelButton: *, acceptButton: *}, targetEvent: (*|boolean), escapeToClose: (*|boolean), controllerAs: string, bindToController: boolean, multiple: boolean}}
         */
        function prepareDialog(type, content, cancelButton, escapeToCancel, event, hideIcon, avoidStripEvent) {
            // if just confirm content, acceptButton, rejectButton, escapeToCancel, event
            if (!avoidStripEvent)
                content = $sce.trustAsHtml(stripScripts(content));
            else
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
                    hideIcon: hideIcon || false,
                },
                targetEvent: event || false,
                escapeToClose: escapeToCancel || false,
                controllerAs: 'ctrl',
                bindToController: true,
                multiple: true
            }
        }

        function prepareThreeButtonDialog(type, content, cancelButtonText, escapeToCancel, event, hideIcon, avoidStripEvent, button1Text, button2Text) {
            // if just confirm content, acceptButton, rejectButton, escapeToCancel, event
            if (!avoidStripEvent)
                content = $sce.trustAsHtml(stripScripts(content));
            else
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
                    self.button1Callback = function () {
                        $mdDialog.hide({button: 1});
                    };
                    self.button2Callback = function () {
                        $mdDialog.hide({button: 2});
                    }
                },
                locals: {
                    content: content,
                    cancelButton: cancelButtonText ? cancelButtonText : langService.get('cancel'),
                    button1Text: button1Text ? button1Text : langService.get('yes'),
                    button2Text: button2Text,
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
         * @param avoidStripEvent
         * @returns {promise}
         */
        self.alertMessage = function (content, cancelButton, escapeToCancel, event, avoidStripEvent) {
            var dialog = prepareDialog('alert', content, cancelButton, escapeToCancel, event, avoidStripEvent);
            return $mdDialog.show(dialog);
        };
        /**
         * success dialog
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param hideIcon
         * @param avoidStripEvent
         * @returns {promise}
         */
        self.successMessage = function (content, cancelButton, escapeToCancel, event, hideIcon, avoidStripEvent) {
            var dialog = prepareDialog('success', content, cancelButton, escapeToCancel, event, hideIcon, avoidStripEvent);
            return $mdDialog.show(dialog);
        };
        /**
         * error dialog
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param avoidStripEvent
         * @returns {promise}
         */
        self.errorMessage = function (content, cancelButton, escapeToCancel, event, avoidStripEvent) {
            var dialog = prepareDialog('error', content, cancelButton, escapeToCancel, event, avoidStripEvent);
            return $mdDialog.show(dialog);
        };
        /**
         * info message
         * @param content
         * @param cancelButton
         * @param escapeToCancel
         * @param event
         * @param avoidStripEvent
         * @return {promise}
         */
        self.infoMessage = function (content, cancelButton, escapeToCancel, event, avoidStripEvent) {
            var dialog = prepareDialog('info', content, cancelButton, escapeToCancel, event, avoidStripEvent);
            return $mdDialog.show(dialog);
        };
        /**
         * confirm dialog
         * @param content
         * @param acceptButton
         * @param rejectButton
         * @param event
         * @param avoidStripEvent
         * @returns {promise}
         */
        self.confirmMessage = function (content, acceptButton, rejectButton, event, avoidStripEvent) {
            var dialog = prepareDialog('confirm', content, rejectButton, acceptButton, event, avoidStripEvent);
            return $mdDialog.show(dialog);
        };
        /**
         * plain dialog
         * @param content
         * @param cancelButtonText
         * @param escapeToCancel
         * @param event
         * @param hideIcon
         * @returns {promise}
         */
        self.plainMessage = function (content, cancelButtonText, escapeToCancel, event, hideIcon) {
            var dialog = prepareDialog('plain', content, cancelButtonText, escapeToCancel, event, hideIcon, true);
            return $mdDialog.show(dialog);
        };

        self.confirmThreeButtonMessage = function (content, cancelButtonText, button1Text, button2Text, escapeToCancel, event, hideIcon) {
            var dialog = prepareThreeButtonDialog('confirm-three-button', content, cancelButtonText, escapeToCancel, event, hideIcon, false, button1Text, button2Text);
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
        };


        /**
         * show a prompt dialog
         * @param ev
         * @param title
         * @param text
         * @param placeHolder
         * @return user input
         */
        self.showPrompt = function (ev, title, text, placeHolder) {
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
