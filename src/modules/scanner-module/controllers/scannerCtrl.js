module.exports = function (app) {
    app.controller('scannerCtrl', function (loadSameScanner,
                                            $q,
                                            $element,
                                            $timeout,
                                            scannerService,
                                            toast,
                                            attachmentService,
                                            // IPSettings,
                                            // getFilterProperty,
                                            // FilterProperty,
                                            // Filter,
                                            _,
                                            langService,
                                            $scope,
                                            dialog,
                                            PixColorFormat,
                                            Uploader,
                                            FileType,
                                            Tags,
                                            PleaseWaitDialog,
                                            LoadScannerOption,
                                            CCToolkit) {
        'ngInject';

        var self = this;
        self.controllerName = 'scannerCtrl';
        self.sessionCreated = false;
        self.scannerLoaded = false;
        self.processInProgress = false;
        self.selectedScanner = null;
        self.PixColorFormat = PixColorFormat;
        self.Tags = Tags;

        self.currentPage = null;

        self.fullscreen = false;

        self.listColorFormat = [];
        self.listScanMode = [];
        self.listPaperSize = [];
        self.listResolution = [];
        self.listSelColorFormat = [
            langService.get('default_color'),
            langService.get('binary_color'),
            langService.get('gray_color')
        ];

        self.filters = [];

        self.convertMode = 0;
        self.brightness = 127;
        self.contrast = 127;

        self.colorFormat = null;
        self.scanMode = null;
        self.paperSize = null;
        self.resolution = null;

        self.duration = 0;

        self.rotate = 0;

        self.width = 0;
        self.height = 0;

        self.disableProperties = {
            colorFormat: true,
            scanMode: true,
            paperSize: true,
            resolution: true
        };

        self.selectedFilters = {
            checkautorotation: false
        };

        self.cc = CCToolkit = new CCToolkit();

        self.fullScreenToggle = function () {
            self.fullscreen = !self.fullscreen;
        };
        self.disableProperty = function (property) {
            self.disableProperties[property] = true;
        };

        self.moveDown = function (page) {
            self.cc.getDocument().movePageDown(page.getPageNumber());
        };
        self.moveUp = function (page) {
            self.cc.getDocument().movePageUp(page.getPageNumber());
        };
        self.canDelete = function () {
            return self.cc.getDocument().pages.length > 1;
        };
        self.deletePage = function (page) {
            self.cc.getDocument().deletePage(page, function (pageAfter) {
                self.showPage(pageAfter);
            });
        };
        self.enableProperty = function (property) {
            self.disableProperties[property] = false;
        };
        self.changeDisableProperties = function (currentValue) {
            _.map(self.disableProperties, function (value, key) {
                self.disableProperties[key] = currentValue;
            })
        };

        self.disableAllProperties = function () {
            self.changeDisableProperties(true);
        };

        self.disableAllProperties = function () {
            self.changeDisableProperties(false);
        };


        self.closeScanner = function () {
            dialog.cancel();
        };
        // TODO : enhance send method
        self.sendDocument = function () {
            PleaseWaitDialog.show(true, false);
            self.cc.getDocument().save(FileType.Pdf, function () {

            }, function (data) {
                PleaseWaitDialog.show(false);
                var uploader = new Uploader(self.cc, null, function (progress) {

                }, function (blob, file, url) {
                    var images = {
                        blob: blob,
                        file: file,
                        url: url
                    };
                    scannerService.storeImages(images);
                    dialog.hide(images);
                });

                uploader.send(data);
            })
        };

        self.updateScope = function () {
            ///
        };

        self.selectScanner = function () {
            self.loadCCScanner(LoadScannerOption.ShowDriverList);
        };

        function populateColorFormats(data) {
            if (data.Choices && Number(data.Choices.ChoiceKind) === 2 && data.Choices.IntegerList) {
                self.listColorFormat = data.Choices.IntegerList;
                self.colorFormat = data.Value.IntegerValue;
                // self.updateScope();
                self.enableProperty('colorFormat');

            }
        }


        function IPSettings(filters) {
            return {ImageOutput: {FileType: 0, Compression: 0}, Filters: filters};
        }

        function Filter(name, properties) {
            return {Name: name, Properties: properties};
        }

        function FilterProperty(name, value) {
            return {Name: name, Value: value};
        }

        function getFilterProperty(filters, filterName, propName) {
            for (var i in filters) {
                if (filters[i].Name === filterName) {
                    for (var y in filters[i].Properties) {
                        if (filters[i].Properties[y].Name === propName) {
                            return filters[i].Properties[y].Value;
                        }
                    }
                }
            }
            return null;
        }

        function setFilterProperty(filters, filterName, propName, propValue) {
            for (var i in filters) {
                if (filters[i].Name === filterName) {
                    for (var y in filters[i].Properties) {
                        if (filters[i].Properties[y].Name === propName) {
                            filters[i].Properties[y].Value = propValue;
                        }
                    }
                }
            }
        }

        function populateScanType(data) {
            if (data.Choices && Number(data.Choices.ChoiceKind) === 2 && data.Choices.IntegerList) {
                self.listScanMode = data.Choices.IntegerList;
                self.scanMode = data.Value.IntegerValue;
                self.updateScope();
                self.enableProperty('scanMode');
            }
        }


        function populatePageSize(data) {
            if (data.Choices && Number(data.Choices.ChoiceKind) === 2 && data.Choices.StringList) {
                self.listPaperSize = data.Choices.StringList;
                self.paperSize = data.Value.StringValue;
                self.updateScope();
                self.enableProperty('paperSize');
            }
        }

        function populateResolution(data) {
            var choiceItems = [];
            if (data.Choices && Number(data.Choices.ChoiceKind) === 2 && data.Choices.IntegerList) {
                choiceItems = data.Choices.IntegerList;
            }
            else if (data.Choices && Number(data.Choices.ChoiceKind) === 1) {
                choiceItems = getResolutionItems(data.Choices);
            }
            self.listResolution = choiceItems;
            self.resolution = data.Value.IntegerValue;
            self.updateScope();
            self.enableProperty('resolution');
        }

        function getResolutionItems(choices) {
            var items = [];
            for (var i = choices.MinValue; i <= choices.MaxValue;) {
                items.push(i);

                if (choices.StepValue === 1 && i < 300) {
                    i += 25;
                }
                else if (choices.StepValue === 1 && i >= 300) {
                    i += 50;
                }
                else {
                    i += choices.StepValue;
                }
            }

            return items;
        }

        function showScannerUI() {
            CCToolkit.showScannerConfigurationDialog(function () {
                self.loadScannerSettings({ScannerModel: self.selectedScanner});
            });
        }

        function isErrorExist(data) {
            return (data.Status !== 0);
        }

        function displayError(data) {
            window.setTimeout(function () {
                toast.error(data.StatusMessage);
            }, 1000);
        }

        function setTagCallback(data) {
            if (isErrorExist(data)) {
                displayError(data);
            }
        }

        function updateUIForScanning(showFile) {
            // clearImageGallery();
            // showImportedFile(showFile);
            // showThumbnails();
            // showDetailsPanel();
            // PleaseWaitDialog.show(true, true);
        }

        function cleanUpDetailsPanel() {
            //hideDetailsPanel();
            //showDetailsPanel();
        }

        function getTagCallback(data) {
            if (isErrorExist(data)) {
                displayError(data);
                return;
            }
            if (data.TagID === Tags.TAG_PAGESIZE) {
                populatePageSize(data);
            }
            if (data.TagID === Tags.TAG_XRESOLUTION) {
                populateResolution(data);
            }
            if (data.TagID === Tags.TAG_SCANTYPE) {
                populateScanType(data);
            }

            if (data.TagID === Tags.TAG_MODE_COMBO) {
                populateColorFormats(data);
            }
        }

        function onScanStarted(data) {
            if (isErrorExist(data)) {
                displayError(data);
                return;
            }

            self.processInProgress = true;
            var d = new Date();
            self.duration = d.getTime();
            PleaseWaitDialog.show(true, true, self.onStopScanClick, self.cc);
        }

        function addImageToGallery(page) {
            // var imageUrl = page.getCurrent() ? page.getCurrent(100, 0) : page.getOriginal(100, 0);
            var imageNumber = page.getPageNumber();
        }

        function setRotation(rot) {
            self.rotate = rot;
        }

        function getRotation() {
            return parseInt(self.rotate);
        }

        function showImageInfo(imageData, page) {
            var msg = "<b>Image information:</b><br/>";
            msg += "ImageID: " + imageData.ImageID + "; <br /> ";
            msg += "Image size: " + imageData.ImageSize + " bytes; <br /> ";

            var imageInfo = imageData.ImageInfo;
            msg += "Width:" + imageInfo.Width + "; <br /> ";
            msg += "Height:" + imageInfo.Height + "; <br /> ";
            msg += "XResolution: " + imageInfo.XResolution + "; <br /> ";
            msg += "YResolution: " + imageInfo.YResolution + "; <br /> ";
            msg += "SamplesPerPixel: " + imageInfo.ColorFormat.SamplesPerPixel + "; <br /> ";
            msg += "BitsPerSample: " + imageInfo.ColorFormat.BitsPerSample + "; <br /> ";
            msg += "<a href=\"" + page.getOriginal(0, 0, 0, 0) + "\">Original page</a> <br />";
            msg += "<a href=\"" + page.getCurrent(0, 0, 0, 0) + "\">Current page</a> <br />";
            msg += "<br/>";

            $("#divImageInfo").html(msg);

            if (imageData.MetaData) {
                showImageMetaData(imageData.MetaData);
            }

            if (imageData.FilterResults) {
                showFilterResults(imageData.FilterResults);
            } else {
                $("#divFiltersResult").html("");
            }

            $("#btnSendToServer").show("");
        }

        function updateImageInGallery(page) {
            var imageUrl = page.getCurrent() ? page.getCurrent(100, 0) : page.getOriginal(100, 0);
            var imageNumber = page.getPageNumber();
            var img = $("#divThumb" + imageNumber).find("img");
            img.attr("src", imageUrl);
        }


        function showImageMetaData(metadata) {
            var msg = "<b>Image metadata:</b>";
            msg += "<br />";
            msg += "Page is ";
            msg += metadata.BlankPage ? "blank" : "not blank";
            msg += "<br />";
            msg += "HardwareJobSeparator: " + !!metadata.HardwareJobSeparator;
            msg += "<br />";
            msg += metadata.PageSide === 0 ? "PageSide: Front" : "PageSide: Back";

            if (metadata.Barcodes && metadata.Barcodes.length) {
                msg += "<p>";
                msg += "<b>Barcodes:</b><br />";
                for (var i = 0; i < metadata.Barcodes.length; i++) {
                    msg += "Text: " + metadata.Barcodes[i].Text + "<br />";
                }
                msg += "</p>";
            }

            if (metadata.EndorserStrings && metadata.EndorserStrings.length) {
                msg += "<p>";
                msg += "<b>EndorserStrings:</b><br />";
                for (var i = 0; i < metadata.EndorserStrings.length; i++) {
                    msg += metadata.EndorserStrings[i].Id + ": " + metadata.EndorserStrings[i].LastEndorserString + "<br />";
                }
                msg += "</p>";
            }

            msg += "<br/>";
            msg += "<br/>";
            $("#divMetaData").html(msg);
        }

        function showImageDetailsCallbackInternal(page, data) {
            if (isErrorExist(data)) {
                displayError(data);
                return;
            }

            window.CurrentImage = page.getPageNumber();
            self.currentPage = page;
            var filters = page.getFilters();
            if (filters === null) {
                setRotation(0);
            } else {
                var rot = getFilterProperty(page.getFilters().Filters, "transformation", "rotation");
                setRotation((rot === undefined || rot === 8) ? 0 : rot);
            }

            // web browsers cannot show large images hence request scaled copy of the image
            var width = 0;
            var height = 0;
            var maxSize = 4000;
            if (data.ImageInfo.Width > maxSize || data.ImageInfo.height > maxSize) {
                if (data.ImageInfo.Width > data.ImageInfo.height) {
                    width = maxSize;
                } else {
                    height = maxSize;
                }
            }

            self.width = width;
            self.height = height;

            // console.log(page.getCurrent(width, height));

            // TODO here we can push the current images selected
            showImageInfo(data, page);
            updateImageInGallery(page);
            $("#imgDetails").show();
        }

        function showImageDetailsCallback(page, data) {
            showImageDetailsCallbackInternal(page, data);
            $timeout(function () {
                PleaseWaitDialog.show(false);
            }, 500);
        }

        function showImageDetails(imageNumber) {
            var document = CCToolkit.getDocument();
            var page = document.getPage(imageNumber);
            page.getImageInfo(showImageDetailsCallback);
        }

        function clearAllFilters() {
            // get all filters
            var filters = getDefaultFiltersOrder();
            for (var i in filters) {
                if (isFilterSelected('check' + filters[i])) {
                    selectFilter('check' + filters[i]);
                }
            }
            configureColorTransformationFilterUI(0, 127, 127);
        }

        function configureFiltersUI(imageNumber) {
            var page = CCToolkit.getDocument().getPage(imageNumber);

            var filters = page.getFilters();
            clearAllFilters();
            if (filters) {
                for (var i in filters.Filters) {
                    var name = filters.Filters[i].Name;
                    if (name !== 'transformation' || name !== 'colortransformation') {
                        if (!isFilterSelected('check' + name))
                            selectFilter('check' + name);
                    }
                    if (name === 'colortransformation') {
                        var filter = filters.Filters[i];
                        configureColorTransformationFilterUI(
                            getFilterPropertyValue(filter, 'convertmode'),
                            getFilterPropertyValue(filter, 'brightness'),
                            getFilterPropertyValue(filter, 'contrast'));
                    }
                }
            }
        }

        function showFilterResults(filtersResult) {
            var msg = "<b>Filters result:</b>";
            msg += "<br/>";
            for (var index in filtersResult) {
                msg += "<b>" + filtersResult[index].Name + "</b>";
                msg += "<br/>";
                msg += filtersResult[index].Results[0].Value;
                msg += "<br/>";
            }

            $("#divFiltersResult").html(msg);
        }

        function configureColorTransformationFilterUI(convertMode, brightness, contrast) {
            self.convertMode = convertMode;
            self.brightness = brightness;
            self.contrast = contrast;
        }

        function isFilterSelected(filter) {
            return self.selectedFilters[filter];
        }

        function getFilterPropertyValue(filter, propertyName) {
            for (var i = 0; i < filter.Properties.length; ++i) {
                if (filter.Properties[i].Name === propertyName)
                    return filter.Properties[i].Value;
            }
            return null;
        }

        function getCropArea() {
            if (!$('#divCrop').is(':visible')) {
                return [0, 0, 0, 0];
            }

            var coord = [];
            var imageArea = $('#imgDetails');
            var cropArea = $('#divCrop');
            var koef = imageArea[0].naturalWidth / imageArea.width();
            coord.push(parseInt((cropArea.offset().left - imageArea.offset().left) * koef, 10));
            coord.push(parseInt((cropArea.offset().top - imageArea.offset().top) * koef, 10));
            coord.push(parseInt((cropArea.offset().left - imageArea.offset().left + cropArea.width()) * koef, 10));
            coord.push(parseInt((cropArea.offset().top - imageArea.offset().top + cropArea.height()) * koef, 10));
            return coord;
        }

        function getBarcodeConfiguration() {
            var barcodes = "";
            var barcodeCheckboxes = $("#divBarcodes").children("input");
            var first = true;
            for (var i in barcodeCheckboxes) {
                if (barcodeCheckboxes[i].checked === true) {
                    if (first) first = false;
                    else barcodes += ",";
                    barcodes += barcodeCheckboxes[i].value;
                }
            }

            return barcodes;
        }

        function selectFilter(filter) {
            if (typeof buttonId === undefined) {
                return;
            }

            self.selectedFilters[filter] = !self.selectedFilters[filter];
        }

        function getDefaultFiltersOrder() {
            return ['transformation',
                'crop',
                'colortransformation',
                'deskew',
                'autocrop',
                'despeckle',
                'lineremoval',
                'overscanremoval',
                'barcodes',
                'blank',
                'autorotation'];
        }

        function selectPageThumbnail(imageNumber) {
            _.map(self.cc.getDocument().pages, function (page, idx) {
                self.cc.getDocument().pages[idx].selected = (page.getPageNumber() === imageNumber);
            });
        }

        function resolveShow(page) {
            var defer = $q.defer();
            var result = page.getImageInfo(function () {
                defer.resolve(page.getPageNumber());
            });
            if (!result) {
                PleaseWaitDialog.show(true, false);
            }
            return defer.promise;
        }

        self.showPage = function (page) {
            resolveShow(page).then(function (imageNumber) {
                showImageDetails(imageNumber);
                configureFiltersUI(imageNumber);
                selectPageThumbnail(imageNumber);
            });
        };

        function onNewPageAdded(data, page) {
            // TODO : need to add the current scanned image to the list
            // data.NumberOfScannedImages Number of Images
            addImageToGallery(page);
        }

        function uploadComplete(jobID, document) {
            self.processInProgress = false;
            //TODO : need to show link for the imported file.
            var importedFile = $("#importedFileLink");
            importedFile.attr("href", document.getImportedFile());
        }

        function onJobFinished(data, document) {
            var d = new Date();
            var dur = d.getTime() - self.duration;
            var speed = data.NumberOfScannedImages * 60000 / dur;

            if (isErrorExist(data)) {
                displayError(data);
            }
            // TODO: need to display message with speed of scanning process and number of scanned images.
            $("#lblScanProgress").html("Scanned images number:" + data.NumberOfScannedImages + "<br />Speed: " + speed.toFixed(2) + " ppm");
            $("#btnSendAllToServer").show();
            uploadComplete(data.ScanJobID, document);
            // TODO : need to hide progress bar
            PleaseWaitDialog.show(false);
            $timeout(function () {
                self.showPage(document.pages[0]);
            }, 500);
        }

        function stopScanningCallback(data) {
            if (isErrorExist(data)) {
                displayError(data);
            }
        }

        function fillFilterOrderWithDefault() {
            if (!self.filters.length) {
                var filters = getDefaultFiltersOrder();
                _.map(filters, function (filter) {
                    self.filters.push(filter);
                    console.log("HIHIHIHI");
                });
            }
        }

        function getFilterSettings() {
            var filterSettings = {};
            filterSettings["transformation"] = [FilterProperty("rotation", typeof getRotation() === undefined ? 0 : getRotation())];
            filterSettings["colortransformation"] = [
                FilterProperty("convertmode", self.convertMode),
                FilterProperty("brightness", self.brightness),
                FilterProperty("contrast", self.contrast)
            ];

            filterSettings["deskew"] = [FilterProperty("FillColor", "0,0,0")];
            filterSettings["autorotation"] = [FilterProperty("mode", "0")];
            filterSettings["autocrop"] = [FilterProperty("mode", "0")];
            filterSettings["despeckle"] = [];
            filterSettings["barcodes"] = [FilterProperty("symbologies", getBarcodeConfiguration()), FilterProperty("confidence", "50")];
            filterSettings["blank"] = [FilterProperty("dirtylevel", 0)];
            filterSettings["lineremoval"] = [];
            var crop = getCropArea();
            filterSettings["crop"] = [FilterProperty("rectangle", crop[0] + ',' + crop[1] + ',' + crop[2] + ',' + crop[3])];
            filterSettings["overscanremoval"] = [];
            return filterSettings;
        }

        function getFilters() {
            fillFilterOrderWithDefault();
            var filterSettings = getFilterSettings();
            var filters = IPSettings([]);
            _.map(self.filters, function (filter) {
                var name = filter;
                if (isFilterSelected('check' + name) ||
                    name === 'transformation' ||
                    name === 'colortransformation') {
                    filters.Filters.push(Filter(name, filterSettings[name]));
                }
            });
            return filters;
        }

        function processPageInternal(filetype, compression, callback) {
            var page = CCToolkit.getDocument().getPage(window.CurrentImage);
            var filters = getFilters();

            if (page.getFilters()) {
                // if the page is cropped then take crop rectangle from previously applied filters
                for (var i in page.getFilters().Filters) {
                    if (page.getFilters().Filters[i].Name === "crop") {
                        setFilterProperty(filters.Filters, "crop", "rectangle", page.getFilters().Filters[i].Properties[0].Value);
                        break;
                    }
                }
            }
            filters.ImageOutput.FileType = filetype;
            filters.ImageOutput.Compression = compression;
            page.enhanceAndAnalize(filters, callback);
        }

        function processPage(filter) {
            selectFilter(filter);
            PleaseWaitDialog.show(true);
            processPageInternal(0, 0, showImageDetailsCallback);
        }

        function displayErrorMessage(msg) {
            toast.error(msg);
        }

        self.onBrightness = function () {
            if (self.brightness === "") {
                return;
            }

            if (self.brightness < 0 || self.brightness > 255) {
                displayErrorMessage("Brightness should be between 0 and 255");
            } else {
                processPage();
            }
        };

        self.processPage = function (filter) {
            processPage(filter);
        };

        self.onContrast = function () {
            if (self.contrast === "") {
                return;
            }

            if (self.contrast < 0 || self.contrast > 255) {
                displayErrorMessage("Contrast should be between 0 and 255");
            } else {
                processPage();
            }

        };

        self.rotateLeft = function (page) {
            var filters = page.getFilters();
            if (filters !== null) {
                setRotation(getFilterProperty(filters.Filters, "transformation", "rotation"));
            }
            setRotation(getRotation() - 1);
            if (getRotation() < 0) {
                setRotation(3);
            }

            processPage();
        };

        self.rotateRight = function (page) {
            var filters = page.getFilters();
            if (filters !== null) {
                setRotation(getFilterProperty(filters.Filters, "transformation", "rotation"));
            }

            setRotation(getRotation() + 1);
            if (getRotation() > 3) {
                setRotation(0);
            }
            processPage();

        };

        self.onCloneImage = function () {
            var doc = CCToolkit.getDocument();
            doc.clonePage(self.currentPage.getPageNumber(), addImageToGallery);
        };

        self.onScanModeChanged = function (value) {
            CCToolkit.setTagIntegerValue(Tags.TAG_SCANTYPE, value, 0, setTagCallback);
        };
        self.onPaperSizeChanged = function (value) {
            CCToolkit.setTagStringValue(Tags.TAG_PAGESIZE, value, setTagCallback);
        };
        self.onColorFormatChanged = function (value) {
            CCToolkit.setTagIntegerValue(Tags.TAG_MODE_COMBO, value, 0, setTagCallback);
        };
        self.onResolutionChanged = function (value) {
            CCToolkit.setTagRationalValue(Tags.TAG_XRESOLUTION, value, 1, 0, setTagCallback);
        };
        self.onStopScanClick = function () {
            CCToolkit.stopScanning(stopScanningCallback);
        };
        self.onImportFileClick = function (files, element) {
            updateUIForScanning(true);
            cleanUpDetailsPanel();
            if (!window.FileReader) {
                PleaseWaitDialog.show(false);
                dialog.errorMessage(langService.get('update_browser'));
                return;
            }

            var reader = new FileReader();
            reader.onload = function (evt) {
                CCToolkit.startImporting(evt.target.result,
                    onScanStarted,
                    onNewPageAdded,
                    onJobFinished);
            };

            reader.onerror = function (evt) {
                // TODO : need to hide progress bar
                PleaseWaitDialog.show(false);
                dialog.errorMessage(evt.message);
            };

            attachmentService
                .validateBeforeUpload('scannerImport', files[0])
                .then(function (file) {
                    reader.readAsDataURL(file);
                })
                .catch(function (availableExtensions) {
                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                });

        };

        self.onShowScannerUIClick = function () {
            showScannerUI();
        };

        self.onScanClick = function () {
            updateUIForScanning(false);
            CCToolkit.startScanning(onScanStarted,
                onNewPageAdded,
                onJobFinished);
        };

        self.loadScannerSettings = function (selectedScanner) {
            var defer = $q.defer();
            self.disableAllProperties();

            CCToolkit.getTag(Tags.TAG_PAGESIZE, 0, getTagCallback);
            CCToolkit.getTag(Tags.TAG_SCANTYPE, 0, getTagCallback);
            CCToolkit.getTag(Tags.TAG_XRESOLUTION, 0, getTagCallback);
            CCToolkit.getTag(Tags.TAG_MODE_COMBO, 0, getTagCallback);

            self.selectedScanner = selectedScanner.ScannerModel;
            self.updateScope();
            self.scannerLoaded = true;
            defer.resolve(self.selectedScanner);
            return defer.promise;
        };

        self.loadCCScanner = function (loadScannerOption) {
            CCToolkit.loadScanner({loadScannerOption: loadScannerOption}, self.loadScannerSettings);
        };


        /**
         * create scanner session to start scan.
         * @param loadSameScanner
         */
        self.createCCSession = function (loadSameScanner) {
            var defer = $q.defer();
            //J4SFG-CVXS8-Y9E64-FSBZH
            //9JBF8-9JKE8-DDE64-XRC22
            CCToolkit.createSession({
                licenseId: "EBLA Computer Consultancy Co-CMS_9JBF8-9JKE8-DDE64-XRC22",
                applicationId: "CMS-PACKAGING",
                closeExistingSessions: true,
                locale: "en-us",
                warnDisableOption: 1 // give the user ability to hide the select scanner warning message from display again.
            }, function (sessionID) {
                defer.resolve(sessionID);
                self.sessionCreated = true;
                if (loadSameScanner) {
                    self.loadCCScanner(LoadScannerOption.UseLastConfiguration)
                }
            });
            return defer.promise;
        };

        // create session
        self.createCCSession(loadSameScanner);


    });
};