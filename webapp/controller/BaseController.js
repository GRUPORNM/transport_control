
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";
    var TQAModel;


    return Controller.extend("zmmtransportcontrol.controller.BaseController", {
        getModelTQA: function () {
            return TQAModel;
        },

        onObjectMatched: function (oEvent) {
            this._bindView("/" + oEvent.getParameter("config").pattern.replace("/{objectId}", "") + oEvent.getParameter("arguments").objectId, true);
        },

        _bindView: function (sObjectPath, bForceRefresh) {
            this.getModel("appView").setProperty("/sPath", sObjectPath);
            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    dataRequested: function (oData) {
                    }.bind(this),
                    dataReceived: function (sData) {
                        this.ResultInspection(sData.getParameters().data)
                    }.bind(this)
                }
            });

            if (bForceRefresh) {
                this.getView().getModel().refresh();
            }
        },

        setModelTQA: function (token) {
            var userLanguage = sessionStorage.getItem("oLangu");
            if (!userLanguage) {
                userLanguage = "EN";
            }
            var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

            TQAModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: serviceUrlWithLanguage,
                annotationURI: "/zsrv_iwfnd/Annotations(TechnicalName='ZODMM_TABLET_ORDERS_ANNO_MDL',Version='0001')/$value/",
                headers: {
                    "authorization": token,
                    "applicationName": "MANAGE_BAYS"
                }
            });

            var vModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/TQA/OD_VARIANTS_MANAGEMENT_SRV",
                headers: {
                    "authorization": token,
                    "applicationName": "MANAGE_BAYS"
                }
            });
            this.setModel(vModel, "vModel");
            this.setModel(TQAModel);
        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        dateFormat: function (oDate) {

            if (oDate != null) {
                var oDate = (oDate instanceof Date) ? oDate : new Date(oDate);
                var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy" });

                return dateFormat.format(oDate);
            }
        },

        onNavigation: function (sPath, oRoute, oEntityName) {
            if (sPath) {
                this.getRouter().navTo(oRoute, {
                    objectId: sPath.replace(oEntityName, "")
                }, false, true);
            } else {
                this.getRouter().navTo(oRoute, {}, false, true);
            }
        },

        onNavBack: function () {
            sessionStorage.setItem("goToLaunchpad", "X");
            this.onNavigation('', 'RouteMain', '');
            location.reload();
        },

        getFields: function (aControl, aContainers, oMainControl) {
            this.aFields = [];
            aContainers.forEach(oContainer => {

                for (let i = 0; i < aControl.length; i++) {

                    if (oMainControl == "Dialog") {
                        var aContainerFields = sap.ui.getCore().byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getId();

                            try {
                                oField.value = oContainerField.getValue()
                            } catch (error) {
                                oField.value = oContainerField.getSelectedKey();
                            }

                            this.aFields.push(oField);
                        });
                    } else {
                        var aContainerFields = this.byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getName();
                            oField.value = oContainerField.getValue()

                            this.aFields.push(oField);
                        });
                    }
                }
            });

            return this.aFields;
        },

        checkEmptyFields: function (aControl, aContainers, oMainControl) {
            this.getFields(aControl, aContainers, oMainControl);
            this.checked = true;

            if (this.aFields.length > 0) {

                this.aFields.forEach(oField => {
                    if (oMainControl == "Dialog") {
                        var oControl = sap.ui.getCore().byId(oField.id);
                    } else {
                        var oControl = this.byId(oField.id);
                    }

                    if (oControl) {
                        if (oControl.getProperty("enabled")) {
                            try {
                                if (oControl.getValue() == "") {
                                    oControl.setValueState("None");
                                    this.checked = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            } catch (error) {
                                if (oControl.getSelectedKey() == "") {
                                    oControl.setValueState("None");
                                    this.checked = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            }
                        }
                    }
                });

                if (this.checked) {
                    return true;
                } else {
                    return false;
                }
            }
        },

        getUserAuthentication: function (type) {
            var that = this,
                urlParams = new URLSearchParams(window.location.search),
                token = urlParams.get('token');

            if (token != null) {
                var headers = new Headers();
                headers.append("X-authorization", token);

                var requestOptions = {
                    method: 'GET',
                    headers: headers,
                    redirect: 'follow'
                };

                fetch("/sap/opu/odata/TQA/AUTHENTICATOR_SRV/USER_AUTHENTICATION", requestOptions)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Ocorreu um erro ao ler a entidade.");
                        }
                        return response.text();
                    })
                    .then(function (xml) {
                        var parser = new DOMParser(),
                            xmlDoc = parser.parseFromString(xml, "text/xml"),
                            successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0],
                            response = successResponseElement.textContent;

                        if (response != 'X') {
                            that.getRouter().navTo("NotFound");
                        }
                        else {
                            that.getModel("appView").setProperty("/token", token);
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            } else {
                that.getRouter().navTo("NotFound");
                return;
            }
        },

        //Ver se a inpecao é OK
        onCheckInspection: function (pPlanoInspection) {
            var aPlanoInspection = pPlanoInspection.StatusInspecao;
            return aPlanoInspection;
        },

        //Resultado da Inspecao ver se tem ou nao divergencias
        onCheckOk: function (pCheck) {
            var aPlanoInspection = pCheck;

            for (let i = 0; i < aPlanoInspection.length; i++) {

                for (let e = 0; e < aPlanoInspection[i].VALUES.length; e++) {

                    if (aPlanoInspection[i].VALUES[e].VALORFINAL === "002") {
                        return ""
                    }
                }
            }
            return "X";
        },

        //Mexer na parte da Detail 
        ResultInspection: function (pDataInspection) {
            var DataSelected = pDataInspection,
                aPlanoInspection = JSON.parse(DataSelected.PlanoInspecao),
                divergencias = [],
                statusResult,
                object,
                ResultInspection = pDataInspection.StatusInspecao;

            for (let i = 0; i < aPlanoInspection.length; i++) {

                aPlanoInspection[i].VALUES = JSON.parse(aPlanoInspection[i].VALUES);
            }

            for (let i = 0; i < aPlanoInspection.length; i++) {

                for (let e = 0; e < aPlanoInspection[i].VALUES.length; e++) {

                    if (aPlanoInspection[i].VALUES[e].VALORFINAL === "002") {

                        object = {
                            id: aPlanoInspection[i].ID,
                            Step: aPlanoInspection[i].TITLE,
                            Divergencia: aPlanoInspection[i].VALUES[e].LABELTEXT
                        }

                        divergencias.push(object)
                    }
                }
            }
            if (ResultInspection === "") {

                statusResult = {
                    icon: "sap-icon://alert",
                    state: "Warning",
                    text: "Inspeção com divergências"
                },

                    this.getModel("oDetailModel").setProperty("/ResultadoInspecao", statusResult);
                this.getModel("oDetailModel").setProperty("/LabelVisivelDataReinsp", true);
                this.getModel("oDetailModel").setProperty("/DataReinspecao", DataSelected.DataAnomaliaInspecao);
                this.getModel("oDetailModel").setProperty("/LabelVisivel", true);
                this.getModel("oDetailModel").setProperty("/LabelVisivelInsp", false);

            } else if (ResultInspection === "X") {

                statusResult = {
                    icon: "sap-icon://sys-enter-2",
                    state: "Success",
                    text: "Inspeção OK"
                },

                    this.getModel("oDetailModel").setProperty("/ResultadoInspecao", statusResult);
                this.getModel("oDetailModel").setProperty("/LabelVisivelDataReinsp", false);
                this.getModel("oDetailModel").setProperty("/DataReinspecao", "");
                this.getModel("oDetailModel").setProperty("/LabelVisivel", false);
                this.getModel("oDetailModel").setProperty("/LabelVisivelInsp", true);

            }

            var divergenciasText = [],
                divergenciasAgrupadas = {};

            for (var l = 0; l < divergencias.length; l++) {

                var step = divergencias[l].Step,
                    divergencia = divergencias[l].Divergencia;

                if (!divergenciasAgrupadas[step]) {
                    divergenciasAgrupadas[step] = [];
                }

                divergenciasAgrupadas[step].push(divergencia);
            }

            for (var step in divergenciasAgrupadas) {

                var divergenciasList = divergenciasAgrupadas[step].join(', ');
                divergenciasText.push(`<strong>${step}</strong><dt></dt> - ${divergenciasList}`);

            }

            var divergenciasTextFinal = divergenciasText.join('<dt></dt>');

            if (divergencias.length === 0) {

                this.getModel("oDetailModel").setProperty("/DivergenciasDetectadas", "");

            } else {

                this.getModel("oDetailModel").setProperty("/LabelVisivel", true);
                this.getModel("oDetailModel").setProperty("/DivergenciasDetectadas", divergenciasTextFinal);

            }

            if (DataSelected.InspecaoRealizada === "R") {

                this.getModel("oDetailModel").setProperty("/LabelVisivelObsReinsp", true);
                this.getModel("oDetailModel").setProperty("/ObsReinspecao", DataSelected.ObsReinspecao);

            } else if (DataSelected.InspecaoRealizada === "I") {

                this.getModel("oDetailModel").setProperty("/LabelVisivelObsReinsp", false);
                this.getModel("oDetailModel").setProperty("/ObsReinspecao", "");

            }
        },
    });
});