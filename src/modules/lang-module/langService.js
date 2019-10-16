module.exports = function (app) {
    app.service('langService', function (Language, CMSModelInterceptor, $timeout, titleService, cmsTemplate, $window, $rootScope, Localization, generator, $http, urlService, $q, $cookies, _) {
        'ngInject';
        var self = this, toast, dialog, addKeyOpened = false, rootEntity;
        self.cookiesKey = 'lang';
        self.current = null;
        self.defaultLanguages = {};
        self.selectedLanguage = null;
        self.currentSelectedLanguage = null;
        self.langChangerNotifier = $q.defer();

        self.languages = [
            new Language({
                id: 1,
                title: 'Arabic',
                code: 'ar',
                image: 'qa',
                lookupKey: 1
            }),
            new Language({
                id: 2,
                title: 'English',
                code: 'en',
                image: 'uk',
                lookupKey: 2
            })
        ];
        /*
        "username": {
        "ar": "اسم المستخدم",
        "en": "Username"
    }
         */
        // this is default languages keys
        self.langKeys = {
            ar: {
                root_entity_not_found: 'لم تقدم جهة للأتصال عن طريقها  <br /> أو ان الجهة غير موجودة للأتصال',
                close: 'إغلاق',
                password: 'كلمة المرور',
                access_denied: 'غير مصرح لك بالوصول',
                username: "اسم المستخدم",
                application_description: 'نظام المراسلات الداخلى',
                login_to_your_account: 'سجل الدخول إلى عضويتك !',
                remember_me: 'تذكرني !',
                login: 'دخول',
                internal_server_error: 'حدثت مشكلة عند معالجة الاجراء',
                menu_item_system_administration: 'إدارة النظام',
                field_required: 'مطلوب لا تتركة فارغاً',
                menu_item_government_entities: 'الجهات الحكومية',
                identifier: 'رمز التعريف',
                arabic_name: 'الاسم العربى',
                english_name: 'الاسم الانجليزي',
                app_arabic_name: 'اسم البرنامج عربي',
                app_english_name: 'أسم البرنامج أنجليزي',
                status: 'الحالة',
                add: 'أضف',
                save: 'حفظ',
                active: 'فعال',
                inactive: 'غير فاعل',
                help_url: 'رابط المساعدة',
                basic_info: 'المعلومات الاساسية',
                connection_settings: 'أعدادات الاتصال',
                server_name_ip: 'Server Name/IP',
                domain_controller_name: 'Domain Controller Name',
                add_new_entity: 'أضافة جهة جديدة',
                tawasol_ou: 'Tawasol OU',
                test_connection: 'أختبار الأتصال',
                filenet: 'FileNet',
                filenet_content_manager_username: 'أسم مستخدم ال Content Manager',
                filenet_content_manager_password: 'كلمة مرور ال Content Manager',
                filenet_content_manager_ejb_address: 'Content Manager Ejb عنوان',
                filenet_content_manager_stanza: 'Content Manager Stanza',
                filenet_object_store_name: 'أسم ال Object Store',
                filenet_process_engine_router_name: 'Process Engine Router أسم',
                tawasol_supporting_database: 'قاعدة بيانات تواصل',
                database_name: 'أسم قاعدة البيانات',
                data_source_name: 'أسم Data Source',
                smtp: 'بروتوكول نقل البريد الإلكتروني',
                server_address: 'عنوان السيرفر',
                smtp_from_email: 'من بريد الكتروني',
                subject: 'الموضوع',
                smtp_port: 'منفذ الوصول',
                ldap_providers: 'LDAP Providers',
                forget_password: 'نسيت كلمة المرور !',
                search_for_item: 'أبحث عن عنصر في القائمة',
                wyswyg_h1: 'عنوان 1',
                wyswyg_h2: 'عنوان 2',
                wyswyg_h3: 'عنوان 3',
                wyswyg_h4: 'عنوان 4',
                wyswyg_h5: 'عنوان 5',
                wyswyg_h6: 'عنوان 6',
                wyswyg_p: 'فقرة',
                wyswyg_pre: 'نص منسق مسبقًا',
                wyswyg_quote: 'اقتباس /الغاء الاقتباس الاختيار  أو الفقرة',
                wyswyg_bold: 'عريض',
                wyswyg_italics: 'مائل',
                wyswyg_underline: 'خط اسفل',
                wyswyg_strike_through: 'خط بالوسط',
                wyswyg_ul: 'قائمة غير مرتبة',
                wyswyg_ol: 'قائمة مرتبة',
                wyswyg_undo: 'تراجع',
                wyswyg_redo: 'الغاء تراجع',
                wyswyg_justify_left: 'محاذاة النص إلى اليسار',
                wyswyg_justify_right: 'محاذاة النص إلى اليمين',
                wyswyg_justify_center: 'توسط',
                wyswyg_justify_full: 'محاذاة النص',
                wyswyg_indent: 'زيادة المسافة في البداية',
                wyswyg_outdent: 'خفض المسافة في البداية',
                wyswyg_clear: 'حذف التنسيق',
                wyswyg_html: 'Toggle html / Rich Text',
                wyswyg_insert_link: 'اضافة / تعديل رابط',
                wyswyg_insert_image: 'اضافة صورة',
                wyswyg_insert_video: 'اضافة فيديو',
                wyswyg_word_count: 'كلمات',
                wyswyg_char_count: 'أحرف',
                yes: 'نعم',
                no: 'لا',
                confirm_logout: 'هل أنت متأكد أنك تريد تسجيل الخروج ?',
                logout: 'تسجيل خروج',
                user_guide: 'دليل المستخدم',
                enter_otp: 'أدخل OTP',
                view: 'عرض',
                min_length: 'يجب الا يتجاوز :length حروف',
                max_length: 'يجب ان لا تتجاوز :length',
                failed_to_download: 'فشل في التحميل',
                otp_failed_to_download: 'لا يمكن فتح الكتاب ، قد يكون الرابط منتهي الصلاحية أو معطل'
            },
            en: {
                root_entity_not_found: 'No Entity has been provided, to contact through. <br /> Or that the entity does not exist for the connection',
                close: 'Close',
                password: 'Password',
                access_denied: 'access denied',
                application_description: 'Internal Correspondence System',
                login_to_your_account: 'log in to your account !',
                remember_me: 'Remember Me !',
                login: 'login',
                internal_server_error: 'something went wrong.',
                menu_item_system_administration: 'System Administration',
                field_required: 'This is required !',
                menu_item_government_entities: 'Government Entities',
                identifier: 'Identifier',
                arabic_name: 'Arabic Name',
                english_name: 'English Name',
                app_arabic_name: 'Application Arabic Name',
                app_english_name: 'Application English Name',
                status: 'Status',
                add: 'Add',
                active: 'Active',
                inactive: 'Inactive',
                save: 'Save',
                help_url: 'Help URL',
                basic_info: 'Basic Information',
                connection_settings: 'Connection Settings',
                server_name_ip: 'Server Name/IP',
                domain_controller_name: 'Domain Controller Name',
                add_new_entity: 'Add New Entity',
                tawasol_ou: 'Tawasol OU',
                test_connection: 'Test Connection',
                filenet: 'FileNet',
                filenet_content_manager_username: 'Content Manager User Name',
                filenet_content_manager_password: 'Content Manager Password',
                filenet_content_manager_ejb_address: 'Content Manager Ejb Address',
                filenet_content_manager_stanza: 'Content Manager Stanza',
                filenet_object_store_name: 'Object Store Name',
                filenet_process_engine_router_name: 'Process Engine Router Name',
                tawasol_supporting_database: 'Tawasol Database',
                database_name: 'Database Name',
                data_source_name: 'Data Source Name',
                smtp: 'SMTP',
                server_address: 'Server Address',
                smtp_from_email: 'From email',
                subject: 'Subject',
                smtp_port: 'Port',
                ldap_providers: 'LDAP Providers',
                forget_password: 'Forget Password !',
                search_for_item: 'Search for an item in menu',
                wyswyg_h1: 'Heading 1',
                wyswyg_h2: 'Heading 2',
                wyswyg_h3: 'Heading 3',
                wyswyg_h4: 'Heading 4',
                wyswyg_h5: 'Heading 5',
                wyswyg_h6: 'Heading 6',
                wyswyg_p: 'Paragraph',
                wyswyg_pre: 'Preformatted text',
                wyswyg_quote: 'Quote/unquote selection or paragraph',
                wyswyg_bold: 'Bold',
                wyswyg_italics: 'Italic',
                wyswyg_underline: 'Underline',
                wyswyg_strike_through: 'Strikethrough',
                wyswyg_ul: 'Unordered List',
                wyswyg_ol: 'Ordered List',
                wyswyg_undo: 'Undo',
                wyswyg_redo: 'Redo',
                wyswyg_justify_left: 'Align text left',
                wyswyg_justify_right: 'Align text right',
                wyswyg_justify_center: 'Center',
                wyswyg_justify_full: 'Justify text',
                wyswyg_indent: 'Increase indent',
                wyswyg_outdent: 'Decrease indent',
                wyswyg_clear: 'Clear formatting',
                wyswyg_html: 'Toggle html / Rich Text',
                wyswyg_insert_link: 'Insert / edit link',
                wyswyg_insert_image: 'Insert image',
                wyswyg_insert_video: 'Insert video',
                wyswyg_word_count: 'Words',
                wyswyg_char_count: 'Characters',
                yes: 'Yes',
                no: 'No',
                confirm_logout: 'are you sure you want to logout ?',
                logout: 'logout',
                user_guide: 'User Guide',
                enter_otp: 'Enter OTP',
                view: 'View',
                min_length: 'Should be minimum :length characters',
                max_length: 'Should be maximum :length characters',
                failed_to_download: 'Failed to download',
                otp_failed_to_download: 'Cannot open the document, the link may be expired or disabled'
            }
        };


        self.insertRunTimeLangKey = function (keyName, arabic, english) {
            self.langKeys['ar'][keyName] = arabic;
            self.langKeys['en'][keyName] = english;
        };


        self.setSelectedLanguageById = function (langId) {
            self.setSelectedLanguage(_.find(self.languages, function (lang) {
                return lang.id === langId;
            }));
        };

        self.setHttpService = function (http) {
            $http = http;
            return self;
        };
        /**
         * @description set require service for the langService
         * @param dialogService
         * @param toastService
         */
        self.setRequireServices = function (dialogService, toastService) {
            dialog = dialogService;
            toast = toastService;
        };

        self.get = function (langKey, ignoreError) {
            return self.langKeys.hasOwnProperty(self.current) ?
                ((self.langKeys[self.current][langKey]) ? self.langKeys[self.current][langKey] : 'LANG: (' + langKey + ') is Missing!') :
                (ignoreError) ? false : 'LANG: ' + langKey;
        };
        /**
         * @description get list of langkeys and concatenate them.
         * @param langKeys
         * @return {string}
         */
        self.getConcatenated = function (langKeys) {
            var translate = [];
            _.map(langKeys, function (langKey) {
                translate.push(self.get(langKey));
            });
            return translate.join('');
        };

        self.getByLangKey = function (langKey, lang, ignoreError) {
            return self.langKeys.hasOwnProperty(lang) ?
                self.langKeys[lang][langKey] :
                (ignoreError) ? false : 'LANG: ' + langKey;
        };

        self.getKey = function (langKey, lang, ignoreError) {
            return self.langKeys.hasOwnProperty(lang) ?
                self.langKeys[lang][langKey] :
                (ignoreError) ? false : 'LANG: ' + langKey;
        };

        self.getCurrentLang = function () {
            return $cookies.get(self.cookiesKey) ? $cookies.get(self.cookiesKey) : self.setCurrentLang('ar');
        };

        self.is = function (lang) {
            var key = lang.hasOwnProperty('code') ? lang.code : lang;
            return self.current === key;
        };

        self.setCurrentLang = function (langKey) {
            var expiry = new Date();
            expiry.setDate(expiry.getDate() + 365);
            $cookies.put(self.cookiesKey, langKey, {
                expires: expiry
            });
            self.current = langKey;
            self.currentLangTitleCase = _.startCase(_.toLower(langKey));
            self.langChangerNotifier.notify(self.current);
            return self.current;
        };

        self.setEntityCurrentLang = function () {
            if (!rootEntity)
                return;

            var defaultDisplayLang = _.find(self.languages, function (lang) {
                return lang.lookupKey === rootEntity.getGlobalSettings().defaultDisplayLang;
            });
            if (defaultDisplayLang) {
                self.setCurrentLang(defaultDisplayLang.code);
            }
        };

        self.getSelectedLanguage = function () {
            return _.find(self.languages, function (lang) {
                return lang.code === self.current;
            });
        };

        self.prepareLanguages = function () {
            var languages = self.defaultLanguages;
            for (var key in languages) {
                if (languages.hasOwnProperty(key)) {
                    for (var langKey in languages[key]) {
                        if (languages[key].hasOwnProperty(langKey)) {
                            if (!self.langKeys.hasOwnProperty(langKey)) {
                                self.langKeys[langKey] = {};
                            }
                            self.langKeys[langKey][key] = languages[key][langKey];
                        }
                    }
                }

            }
            self.current = self.getCurrentLang();
            self.selectedLanguage = self.getSelectedLanguage();
            $rootScope.$broadcast('$languagePrepared');
            return self.currentSelectedLanguage = angular.extend({}, self.langKeys[self.current], {
                get: self.get,
                getKey: self.getKey,
                is: self.is
            });
        };

        self.loadLanguages = function () {
            return $http.get(urlService.language).then(function (result) {
                self.defaultLanguages = result.data;
                return self.prepareLanguages();
            }).catch(function () {
                alert('language Error');
            });
        };

        self.getLanguages = function () {
            var keys = Object.keys(self.langKeys);
            return keys && Object.keys(self.langKeys[keys[0]]).length > 46 ? $q.when(self.getCurrentTranslate()) : self.loadLanguages();
        };


        self.setSelectedLanguage = function (language, defaultTitle) {
            var result = -1;
            _.filter(self.languages, function (lang, index) {
                if (lang.code === language.code)
                    result = index;
                return lang;
            });

            self.selectedLanguage = self.languages[result];
            self.current = self.selectedLanguage.code;
            if (defaultTitle) {
                titleService.setTitle('TAWASOL');
            } else {
                titleService.setTitle(rootEntity.returnRootEntity().getTranslatedAppName());
            }
            self.setCurrentLang(self.current);
        };
        self.getCurrentTranslate = function () {
            if (!self.current)
                self.current = 'ar';

            return angular.extend({}, self.langKeys[self.current], {
                get: self.get,
                current: self.current,
                getKey: self.getKey,
                is: self.is
            });
        };
        /**
         * @description prepare localization
         * @param localization
         * @param prepare
         */
        self.prepareLocalization = function (localization, prepare) {

            if (angular.isArray(localization) && localization.length && typeof localization[0].setLangService === 'undefined')
                localization = generator.interceptReceivedCollection('Localization', localization);


            _.map(localization, function (local) {
                if (!self.defaultLanguages.hasOwnProperty(local.localizationKey)) {
                    self.defaultLanguages[local.localizationKey] = {};
                }
                self.defaultLanguages[local.localizationKey]['ar'] = local.arName;
                self.defaultLanguages[local.localizationKey]['en'] = local.enName;
                self.defaultLanguages[local.localizationKey]['module'] = local.module;
            });
            if (prepare)
                self.prepareLanguages();
            return self;
        };
        /**
         * @description get localization  by module.
         * load localization by module
         */
        self.loadLocalizationByModule = function (module) {
            var moduleKey = module.hasOwnProperty('id') ? module.lookupKey : module;
            return $http
                .get(urlService.localizations + '/module/' + moduleKey)
                .then(function (result) {
                    var localizations = generator.interceptReceivedCollection('Localization', generator.generateCollection(result.data.rs, Localization));
                    self.prepareLocalization(localizations, true);
                    return localizations;
                });
        };

        self.replaceLanKeyValue = function (local) {
            var keys = Object.keys(self.langKeys);
            for (var i = 0; i < keys.length; i++) {
                self.langKeys[keys[i]][local.localizationKey] = local[keys[i] + 'Name'];
            }
        };
        /**
         * @description delete local from localization table.
         * @param local
         * @return {Promise}
         */
        self.deleteLocalizationKey = function (local) {
            var id = local.hasOwnProperty('id') ? local.id : local;
            return $http
                .delete(urlService.localizations + '/' + id);
        };
        /**
         * @description add localization Key
         * @param local
         */
        self.addLocalizationKey = function (local) {
            return $http
                .post(urlService.localizations, generator.interceptSendInstance('Localization', local))
                .then(function (result) {
                    local.id = result.data.rs;
                    local.isOverrided = true;
                    return generator.interceptReceivedInstance('Localization', generator.generateInstance(local, Localization));
                });
        };
        /**
         * @description to check if the localization key exists or not before add
         * @param key
         * @returns {Promise}
         */
        self.checkLangKeyIfExists = function (key) {
            return $http
                .get(urlService.globalLocalizationLookups + '/localizationkey/' + key)
                .then(function (result) {
                    return result.data.rs;
                })
        };
        /**
         * @description change localization module number.
         * @param module
         * @param localizations
         */
        self.changeLocalizationModule = function (module, localizations) {
            return $http
                .put(urlService.globalLocalizationLookups + '/change-module-bulk', {
                    first: module.lookupKey,
                    second: _.map(localizations, 'localizationKey')
                })
                .then(function (result) {
                    return result.data.rs;
                })
        };
        /**
         * @description load all localization from service.
         */
        self.loadLocalizationKeys = function () {
            return $http
                .get(urlService.localizations)
                .then(function (result) {
                    var localizations = generator.interceptReceivedCollection('Localization', generator.generateCollection(result.data.rs, Localization));
                    self.prepareLocalization(localizations, true);
                    return localizations;
                })
        };
        /**
         * @update localization Key
         * @param local
         */
        self.updateLocalizationKey = function (local) {
            return $http
                .put(urlService.localizations, generator.interceptSendInstance('Localization', local))
                .then(function () {
                    return generator.interceptReceivedInstance('Localization', generator.generateInstance(local, Localization));
                });
        };
        /**
         * @description update global localization key
         * @param local
         * @return {Promise}
         */
        self.updateGlobalLocalizationKey = function (local) {
            return $http
                .put(urlService.globalLocalizationLookups, generator.interceptSendInstance('Localization', local))
                .then(function () {
                    return generator.interceptReceivedInstance('Localization', generator.generateInstance(local, Localization));
                });
        };
        /**
         * @description this just for development area.
         * @param local
         * @return {Promise}
         */
        self.addGlobalLocalizationKey = function (local) {
            return $http
                .post(urlService.globalLocalizationLookups, generator.interceptSendInstance('Localization', local))
                .then(function (result) {
                    local.id = result.data.rs;
                    return generator.interceptReceivedInstance('Localization', generator.generateInstance(local, Localization));
                });
        };

        self.controllerMethod = {
            deleteLocalization: function (local, $event, mute) {
                return dialog
                    .confirmMessage(self.get('confirm_delete').change({name: local.getLocalizationKey()}), null, null, $event)
                    .then(function () {
                        return self.deleteLocalizationKey(local)
                            .then(function () {
                                if (!mute)
                                    toast.success(self.get('delete_specific_success').change({name: local.getLocalizationKey()}));
                                return local;
                            });
                    })
            },
            editLocalization: function (local, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('localization'),
                        controller: 'localizationPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            localization: local,
                            newLocalizationKey: false
                        }
                    });
            },
            addNewLocalizationKey: function ($event) {
                addKeyOpened = true;
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('localization'),
                        controller: 'localizationPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            localization: new Localization(),
                            newLocalizationKey: true
                        }
                    })
                    .then(function (local) {
                        addKeyOpened = false;
                        self.loadLocalizationKeys();
                    })
                    .catch(function () {
                        addKeyOpened = false;
                    });
            }
        };

        self.setRootEntityService = function (service) {
            rootEntity = service;
        };
        /**
         * @description new method the check the current lang as a watcher.
         * @param callback
         */
        self.listeningToChange = function (callback) {
            self.langChangerNotifier.promise.then(function () {
                // resolve not needed
            }, function () {
                // reject not needed
            }, function (current) {
                callback(current)
            });
        };

        angular
            .element($window)
            .on('keypress keydown', function (e) {
                var code = e.which || e.keyCode;
                if (e.ctrlKey && e.altKey && code === 76) {
                    if (!addKeyOpened)
                        self.controllerMethod.addNewLocalizationKey();
                }
            });

        $timeout(function () {
            CMSModelInterceptor.runEvent('langService', 'init', self);
        }, 100);


    });
};
