module.exports = function (app) {
    app.config(function ($provide) {
        'ngInject';
        $provide.decorator('taOptions', ['$delegate', function (taOptions) {
            // $delegate is the taOptions we are decorating
            // here we override the default toolbars and classes specified in taOptions.
            taOptions.forceTextAngularSanitize = true; // set false to allow the textAngular-sanitize provider to be replaced
            taOptions.keyMappings = []; // allow customizable keyMappings for specialized key boards or languages
            taOptions.toolbar = [
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
                ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'undo', 'redo', 'clear'],
                ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'indent', 'outdent'],
                //['html', 'insertImage', 'insertLink', 'insertVideo']
            ];
            taOptions.classes = {
                focussed: '',
                toolbar: 'ta-toolbar',
                toolbarGroup: 'ta-button-group',
                toolbarButton: '',
                toolbarButtonActive: 'active',
                disabled: 'disabled',
                textEditor: 'ta-text-editor',
                htmlEditor: 'md-input'
            };
            return taOptions; // whatever you return will be the taOptions
        }]);

        // this demonstrates changing the classes of the icons for the tools for material design
        $provide.decorator('taTools', ['$delegate', 'langService', function (taTools, langService) {
            var iconButtonString = '<md-button class="md-icon-button cms-icon-button" aria-label="wyswyg_AriaLabelText"><md-icon tooltip="wyswyg_TooltipText" md-svg-icon="wyswyg_IconName"></md-icon></md-button>';
            var textButtonString = '<md-button class="cms-button" aria-label="wyswyg_AriaLabelText">wyswyg_ButtonText</md-button>';

            var buttonTypes = {
                icon: 'icon',
                button: 'button'

            };
            var buttons = {
                h1: {
                    langKey: 'wyswyg_h1',
                    icon: 'format-header-1',
                    type: buttonTypes.icon,
                    buttonText: 'H1'
                },
                h2: {
                    langKey: 'wyswyg_h2',
                    icon: 'format-header-2',
                    type: buttonTypes.icon,
                    buttonText: 'H2'
                },
                h3: {
                    langKey: 'wyswyg_h3',
                    icon: 'format-header-3',
                    type: buttonTypes.icon,
                    buttonText: 'H3'
                },
                h4: {
                    langKey: 'wyswyg_h4',
                    icon: 'format-header-4',
                    type: buttonTypes.icon,
                    buttonText: 'H4'
                },
                h5: {
                    langKey: 'wyswyg_h5',
                    icon: 'format-header-5',
                    type: buttonTypes.icon,
                    buttonText: 'H5'
                },
                h6: {
                    langKey: 'wyswyg_h6',
                    icon: 'format-header-6',
                    type: buttonTypes.icon,
                    buttonText: 'H6'
                },
                p: {
                    langKey: 'wyswyg_p',
                    icon: 'format-paragraph',
                    type: buttonTypes.icon,
                    buttonText: 'P'
                },
                pre: {
                    langKey: 'wyswyg_pre',
                    icon: 'text',
                    type: buttonTypes.icon,
                    buttonText: 'Pre'
                },
                quote: {
                    langKey: 'wyswyg_quote',
                    icon: 'format-quote-close',
                    type: buttonTypes.icon,
                    buttonText: 'quote'
                },
                bold: {
                    langKey: 'wyswyg_bold',
                    icon: 'format-bold',
                    type: buttonTypes.icon,
                    buttonText: 'B'
                },
                italics: {
                    langKey: 'wyswyg_italics',
                    icon: 'format-italic',
                    type: buttonTypes.icon,
                    buttonText: 'I'
                },
                underline: {
                    langKey: 'wyswyg_underline',
                    icon: 'format-underline',
                    type: buttonTypes.icon,
                    buttonText: 'U'
                },
                strikeThrough: {
                    langKey: 'wyswyg_strike_through',
                    icon: 'format-strikethrough',
                    type: buttonTypes.icon,
                    buttonText: 'Strike'
                },
                ul: {
                    langKey: 'wyswyg_ul',
                    icon: 'format-list-bulleted',
                    type: buttonTypes.icon,
                    buttonText: 'UL'
                },
                ol: {
                    langKey: 'wyswyg_ol',
                    icon: 'format-list-numbers',
                    type: buttonTypes.icon,
                    buttonText: 'OL'
                },
                undo: {
                    langKey: 'wyswyg_undo',
                    icon: 'undo',
                    type: buttonTypes.icon,
                    buttonText: 'Undo'
                },
                redo: {
                    langKey: 'wyswyg_redo',
                    icon: 'redo',
                    type: buttonTypes.icon,
                    buttonText: 'Redo'
                },
                justifyLeft: {
                    langKey: 'wyswyg_justify_left',
                    icon: 'format-align-left',
                    type: buttonTypes.icon,
                    buttonText: 'Left'
                },
                justifyRight: {
                    langKey: 'wyswyg_justify_right',
                    icon: 'format-align-right',
                    type: buttonTypes.icon,
                    buttonText: 'Right'
                },
                justifyCenter: {
                    langKey: 'wyswyg_justify_center',
                    icon: 'format-align-center',
                    type: buttonTypes.icon,
                    buttonText: 'Center'
                },
                justifyFull: {
                    langKey: 'wyswyg_justify_full',
                    icon: 'format-align-justify',
                    type: buttonTypes.icon,
                    buttonText: 'Justify'
                },
                indent: {
                    langKey: 'wyswyg_indent',
                    icon: 'format-indent-increase',
                    type: buttonTypes.icon,
                    buttonText: 'Indent +'
                },
                outdent: {
                    langKey: 'wyswyg_outdent',
                    icon: 'format-indent-decrease',
                    type: buttonTypes.icon,
                    buttonText: 'Indent -'
                },
                clear: {
                    langKey: 'wyswyg_clear',
                    icon: 'format-clear',
                    type: buttonTypes.icon,
                    buttonText: 'Clear'
                },
                html: {
                    langKey: 'wyswyg_html',
                    icon: 'code-tags',
                    type: buttonTypes.icon,
                    buttonText: 'HTML'
                },
                insertLink: {
                    langKey: 'wyswyg_insert_link',
                    icon: 'link',
                    type: buttonTypes.icon,
                    buttonText: 'Link'
                },
                insertImage: {
                    langKey: 'wyswyg_insert_image',
                    icon: 'image-plus',
                    type: buttonTypes.icon,
                    buttonText: 'Image'
                },
                insertVideo: {
                    langKey: 'wyswyg_insert_video',
                    icon: 'video-plus',
                    type: buttonTypes.icon,
                    buttonText: 'Video'
                }
            };

            var button;
            for (var buttonKey in buttons) {
                button = buttons[buttonKey];
                if (!button.hide) {
                    if (button.hasOwnProperty('disabledAlways') && button.disabledAlways)
                        taTools[buttonKey].disabled = true;

                    if (button.hasOwnProperty('action'))
                        taTools[buttonKey].action = button.action;

                    taTools[buttonKey].tooltiptext = '';// remove the default tooltip/title and set the tooltip for icon

                    if (button.type === buttonTypes.icon) {
                        taTools[buttonKey].display = iconButtonString
                            .replace('wyswyg_AriaLabelText', langService.get(button.langKey))
                            .replace('wyswyg_TooltipText', langService.get(button.langKey))
                            .replace('wyswyg_IconName', button.icon);
                    }
                    else if (button.type === buttonTypes.button) {
                        taTools[buttonKey].display = textButtonString
                            .replace('wyswyg_AriaLabelText', langService.get(button.langKey))
                            .replace('wyswyg_ButtonText', button.buttonText);
                    }
                }
            }
            return taTools;

        }]);
    });
};