sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"

], function (BaseController, JSONModel, Fragment, FilterOperator, MessageBox) {
    "use strict";

    var aSimpleFormFiels = [
        {
            ID: "dadosSF",
            TITLE: "Dados",
            IDWIZARD: "dadosWizard",
            NEXTSTEP: "wizardID1",
            VALUES: [
                { labelText: "Local", enabled: false, id: "inputLocal", value: "Terminal Químico de Aveiro", descValue: "", type: "input" },
                { labelText: "produtoTransp", enabled: true, id: "produtoTransp", value: "", descValue: "", items: "", itemKey: "", itemDesc: "", type: "selectProduoTransp" },
                { labelText: "motorista", enabled: true, id: "InputMotorista", value: "", descValue: "", control: ".onValueHelpRequest", type: "inputValueHelp" },
                { labelText: "transportadora", enabled: true, id: "InputTransportadora", value: "", descValue: "", control: ".onValueHelpRequest", type: "inputValueHelp" },
                { labelText: "kms", enabled: true, id: "inputKms", enabled: true, value: "", type: "inputKms" },
                { labelText: "viatura", enabled: true, id: "InputViatura", value: "", descValue: "", control: ".onValueHelpRequest", type: "inputValueHelp" },
                { labelText: "data", enabled: true, id: "datepickerData", value: "", descValue: "", type: "datepicker" },
                { labelText: "tipoInspecao", enabled: true, id: "tipoInspecao", value: "", descValue: "", items: "", itemKey: "", itemDesc: "", type: "selectTipoInspecao" },
            ]
        }
    ]

    var aSimpleFormFieldsFooter = [
        {
            ID: "footerSF",
            TITLE: "Inspecao",
            IDWIZARD: "wizardID40",
            NEXTSTEP: "",
            VALUES: [
                { labelText: "Observacoes", enabled: true, value: "", type: "textArea" },
                { labelText: "Foramdetectadasanomaliasnainspecaoefectuada", enabled: true, inspecao: "SIM", value: false, type: "checkBox", dateLabel: "Reinspeccao", dateValue: "" },
            ]
        }
    ];

    var aSimpleFormFieldsReinspeccao = [
        {
            ID: "reinspeccao",
            TITLE: "Reinspecção",
            IDWIZARD: "wizardID42",
            NEXTSTEP: "",
            VALUES: [
                { labelText: "ObservacoesReinspecao", id: "textAreaReinspecao", value: "", type: "textArea" },
                { labelText: "Asanomaliasdetectadasnaprimeirainspecaoforamcorrigidas", id: "checkReinspecao", enabled: true, inspecao: "SIM", value: false, type: "checkBox" },
                { labelText: "Reinspeccao", enabled: true, id: "datepickerDataReinspecao", dateValue: "", type: "datepicker" },
            ]
        }
    ]

    return BaseController.extend("zmmtransportcontrol.controller.MainWizard", {
        onInit: function () {
            var oViewModel = new JSONModel({
                oDataReinspection: {},
                TypeInspection: "",
                dataPlanoInpecao: aSimpleFormFiels,
                dataFooter: aSimpleFormFieldsFooter,
                dataReinspecao: aSimpleFormFieldsReinspeccao,
                dataSteps: [],
                showNextBtn: false,
                creatWizard: {
                    header: aSimpleFormFiels,
                    items: [],
                    footer: [],
                    reinspecao: []
                }
            });

            sessionStorage.setItem("goToLaunchpad", "X");
            this.getView().setModel(oViewModel, "oViewModel");
            this._pValueHelpDialogs = {};

            this._dialogConfig = {
                "InputTransportadora": {
                    fragmentName: "zmmtransportcontrol.view.fragments.transportadoraVH",
                    dialogId: "transportadoraDialog",
                    bindingPath: "/listaTransportadora",
                    filterKey: "usridtrans",
                    titleKey: "name1",
                    descriptionKey: "kunnr",
                },

                "InputViatura": {
                    fragmentName: "zmmtransportcontrol.view.fragments.viaturaVH",
                    dialogId: "viaturaDialog",
                    bindingPath: "/listaViatura",
                    filterKey: "usridviat",
                    titleKey: "eqktx",
                    descriptionKey: "equnr",

                },

                "InputMotorista": {
                    fragmentName: "zmmtransportcontrol.view.fragments.motoristaVH",
                    dialogId: "motoristaDialog",
                    bindingPath: "/listaMotorista",
                    filterKey: "usridmoto",
                    titleKey: "name",
                    descriptionKey: "usrid",
                }
            };



        },

        onAfterRendering: function () {
            var that = this;
            sessionStorage.setItem("goToLaunchpad", "");
            window.addEventListener("message", function (event) {
                var data = event.data;
                if (data.action == "goToMainPage") {

                    MessageBox.warning(that.getResourceBundle().getText("Navback"), {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (sAction) {
                            if (sAction == MessageBox.Action.OK) {
                                that.onNavBack();
                            }
                        },
                    });
                }
            });
            this.validInspect();
        },

        //Validar se é Inspecao ou Reinspecao
        validInspect: function () {
            var oTable = sap.ui.getCore().byId("inspectionTable").getTable(),
                oSelectedItem = oTable.getSelectedItem();

            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext(),
                    oSelectedData = oContext.getProperty(oContext.getPath()),
                    sPath = oContext.getPath().replace("ZCDS_MM_INSP_TLA", "InspectionPlanTLA"),
                    aPlanoInspection = oSelectedData.StatusInspecao;

                var resultInspection = this.onCheckInspection(aPlanoInspection);

                if (resultInspection === "X") {
                    this.getModel("oViewModel").setProperty("/TypeInspection", "I")
                    this.getDataHeader();
                    this.getPlanoInspecao();
                    this.getTransportadora();
                    this.getMotorista();
                    this.getViatura();
                } else {
                    this.getModel("oViewModel").setProperty("/TypeInspection", "R")
                    this.setDataReinspection(sPath);
                }
            } else {
                this.getModel("oViewModel").setProperty("/TypeInspection", "I")
                this.getDataHeader();
                this.getPlanoInspecao();
                this.getTransportadora();
                this.getMotorista();
                this.getViatura();
            }
        },

        //Contruir a tela da Reinspecao
        setDataReinspection: function (sPath) {
            var oModel = this.getView().getModel(),
                sUrl = sPath,
                that = this,
                oResourceBundle = that.getResourceBundle();

            oModel.read(sUrl, {
                success: function (oData) {
                    var oInspection = that.getModel("oViewModel").getProperty("/creatWizard"),
                        dataFooter = that.getModel("oViewModel").getProperty("/dataFooter"),
                        dataReinspecao = that.getModel("oViewModel").getProperty("/dataReinspecao"),
                        oSteps = JSON.parse(oData.PlanoInspecao),
                        oHeader = oInspection.header,
                        oDataFilter = [],
                        oDataReinspection = {
                            idTable: oData.IdTable,
                            item: oData.Item,
                            referencia: oData.Referencia,
                        };

                    that.getModel("oViewModel").setProperty("/oDataReinspection", oDataReinspection)

                    for (let i = 0; i < oSteps.length; i++) {
                        oSteps[i].VALUES = JSON.parse(oSteps[i].VALUES);
                    }

                    var fields = [
                        { labelText: "Local" },
                        { labelText: "produtoTransp", value: oData.ProducTranspNo, enabled: false },
                        { labelText: "motorista", value: oData.MotoristaNo, descValue: oData.Motorista, enabled: false },
                        { labelText: "transportadora", value: oData.TransportadoraNo, descValue: oData.Transportadora, enabled: false },
                        { labelText: "kms", value: oData.Kms, enabled: false },
                        { labelText: "viatura", value: oData.ViaturaNo, descValue: oData.Viatura, enabled: false },
                        { labelText: "data", value: oData.Data, enabled: false },
                        { labelText: "tipoInspecao", value: oData.TipoInspecaoNo, enabled: false }
                    ];

                    fields.forEach(function (field) {
                        let itemFilter = oHeader[0].VALUES.filter(item => item.labelText === field.labelText);
                        if (itemFilter.length > 0) {
                            if (field.value !== undefined) {
                                itemFilter[0].value = field.value;
                            }
                            if (field.descValue) {
                                itemFilter[0].descValue = field.descValue;
                            }
                            if (field.enabled !== undefined) {
                                itemFilter[0].enabled = field.enabled;
                            }
                            oDataFilter.push(itemFilter[0]);
                        }
                    });

                    oHeader[0].VALUES = oDataFilter;

                    var footerUpdates = {
                        "Observacoes": oData.ObsInpecao,
                        "Reinspeccao": oData.DataAnomaliaInspecao,
                        "Foramdetectadasanomaliasnainspecaoefectuada": oData.AnomaliaInspecao
                    };

                    dataFooter.forEach(function (footerItem) {
                        footerItem.VALUES.forEach(function (valueItem) {
                            if (footerUpdates[valueItem.labelText] !== undefined) {
                                if (valueItem.type === "textArea") {
                                    valueItem.value = footerUpdates[valueItem.labelText] || "";
                                } else if (valueItem.type === "checkBox") {
                                    valueItem.value = footerUpdates[valueItem.labelText] === "true";
                                    valueItem.dateValue = footerUpdates["Reinspeccao"] || "";
                                }
                                valueItem.enabled = false;
                            }
                        });
                    });

                    var creatWizard = {
                        header: oHeader,
                        items: oSteps,
                        footer: dataFooter,
                        reinspecao: dataReinspecao
                    };

                    oInspection.header = oHeader;
                    that.getModel("oViewModel").setProperty("/creatWizard", oInspection);
                    that.getModel("oViewModel").setProperty("/dataPlanoInpecao", oHeader);
                    that.getModel("oViewModel").setProperty("/dataSteps", oSteps);
                    that.getModel("oViewModel").setProperty("/dataFooter", dataFooter);
                    that.onBuildWizard(creatWizard);
                },
                error: function (oError) {
                    MessageBox.error(oResourceBundle("ErroCarregarDados"));
                }
            });
        },

        //ValueHelp
        onValueHelpRequest: function (sId) {
            var sInputId = sId,
                oView = this.getView(),
                oConfig,
                aFilters = [];

            switch (sInputId) {
                case "InputTransportadora":
                    oConfig = this._dialogConfig["InputTransportadora"];
                    this.getTransportadora();
                    break;

                case "InputViatura":
                    oConfig = this._dialogConfig["InputViatura"];
                    this.getViatura();
                    break;

                case "InputMotorista":
                    oConfig = this._dialogConfig["InputMotorista"];
                    this.getMotorista();

                    break;
                default:
                    return;
            }
            this.sInputId = sInputId;

            if (!this._pValueHelpDialogs[oConfig.dialogId]) {
                this._pValueHelpDialogs[oConfig.dialogId] = Fragment.load({
                    id: oView.getId(),
                    name: oConfig.fragmentName,
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pValueHelpDialogs[oConfig.dialogId].then(function (oDialog) {
                oDialog.bindAggregation("items", {
                    path: "oViewModel>" + oConfig.bindingPath,
                    template: new sap.m.StandardListItem({
                        title: "{oViewModel>" + oConfig.titleKey + "}",
                        description: "{oViewModel>" + oConfig.descriptionKey + "}"
                    }),
                    filters: aFilters
                });
                oDialog.open();
            });
        },

        //ValueHelp
        onValueHelpSearch: function (oEvent) {
            var sInputId = this.sInputId,
                oConfig = this._dialogConfig[sInputId],
                aFilters = [],
                oFilter;

            if (!oConfig) {
                return;
            }

            var sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter(oConfig.filterKey, FilterOperator.Contains, sValue);

            switch (sInputId) {
                case "InputTransportadora":

                    oFilter = new sap.ui.model.Filter("name1", FilterOperator.Contains, sValue);
                    var iSelectedMotorista = this.getModel("oViewModel").getProperty("/selectedMotorista/company");
                    if (iSelectedMotorista) {
                        aFilters.push(new sap.ui.model.Filter("company", sap.ui.model.FilterOperator.EQ, iSelectedMotorista));
                    }
                    break;

                case "InputMotorista":

                    oFilter = new sap.ui.model.Filter("name", FilterOperator.Contains, sValue);
                    var iSelectedTransportadora = this.getModel("oViewModel").getProperty("/selectedTransportadora/kunnr");
                    if (iSelectedTransportadora) {
                        aFilters.push(new sap.ui.model.Filter("kunnr", sap.ui.model.FilterOperator.EQ, iSelectedTransportadora));
                    }
                    break;

                case "InputViatura":

                    oFilter = new sap.ui.model.Filter("eqktx", FilterOperator.Contains, sValue);
                    break;
                default:
                    break;
            }
            oEvent.getSource().getBinding("items").filter([oFilter].concat(aFilters));
        },

        //ValueHelp
        onValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            oEvent.getSource().getBinding("items").filter([]);
            var aFilters = [];

            if (!oSelectedItem) {
                return;
            }

            var sInputId = this.sInputId;

            switch (sInputId) {
                case "InputMotorista":
                    sap.ui.getCore().byId(sInputId).setValue(oSelectedItem.getTitle());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/2/value", oSelectedItem.getDescription());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/2/descValue", oSelectedItem.getTitle());
                    this.getModel("oViewModel").setProperty("/selectedMotorista", {
                        usrid: oSelectedItem.getDescription(),
                        title: oSelectedItem.getTitle()
                    });

                    var aListaTransportadora = this.getModel("oViewModel").getProperty("/listaTransportadora"),
                        aListaMotorista = this.getModel("oViewModel").getProperty("/listaMotorista"),
                        sMotorista = oSelectedItem.getDescription();

                    if (sMotorista) {
                        var dataMotorista = aListaMotorista.filter(val => val.usrid == sMotorista)
                        aFilters = aListaTransportadora.filter(val => val.kunnr == dataMotorista[0].company)
                        sap.ui.getCore().byId("InputTransportadora").setValue(aFilters[0].name1);
                        this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/3/value", aFilters[0].kunnr);
                        this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/3/descValue", aFilters[0].name1);
                    }
                    this.onStepComplete();
                    break;

                case "InputTransportadora":
                    sap.ui.getCore().byId(sInputId).setValue(oSelectedItem.getTitle());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/3/value", oSelectedItem.getDescription());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/3/descValue", oSelectedItem.getTitle());
                    this.getModel("oViewModel").setProperty("/selectedTransportadora", {
                        kunnr: oSelectedItem.getDescription(),
                        title: oSelectedItem.getTitle()
                    });

                    sap.ui.getCore().byId("InputMotorista").setValue("");
                    this.onStepComplete();
                    break;

                case "InputViatura":
                    sap.ui.getCore().byId(sInputId).setValue(oSelectedItem.getTitle());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/5/value", oSelectedItem.getDescription());
                    this.getModel("oViewModel").setProperty("/dataPlanoInpecao/0/VALUES/5/descValue", oSelectedItem.getTitle());
                    this.onStepComplete();
                    break;

                default:
                    break;
            }
        },

        //Buscar os dados da Transportadora
        getTransportadora: function () {
            var oModel = this.getView().getModel(),
                sUrl = '/xTQAxCARRIERS_VH';


            oModel.read(sUrl, {
                success: function (oData) {
                    var aFilters,
                        aListaTransportadora = oData.results,
                        iSelectedMotorista = this.getModel("oViewModel").getProperty("/selectedMotorista/usrid"),
                        aListaMotorista = this.getModel("oViewModel").getProperty("/listaMotorista");

                    if (iSelectedMotorista) {
                        var dataMotorista = aListaMotorista.filter(val => val.usrid == iSelectedMotorista)

                        aFilters = aListaTransportadora.filter(val => val.kunnr == dataMotorista[0].company)
                        sap.ui.getCore().byId("InputTransportadora").setValue(aFilters[0].name1)
                        this.getModel("oViewModel").setProperty("/listaTransportadora", oData.results)
                    } else {

                        this.getModel("oViewModel").setProperty("/listaTransportadora", oData.results);
                    }
                }.bind(this),
                error: function () {
                    MessageBox.error(this.getResourceBundle().getText("ErroCarregarTransportadora"));
                }
            });
        },

        //Buscar os dados da Viatura
        getViatura: function () {
            var oModel = this.getView().getModel(),
                sUrl = '/xTQAxEQUIPMENTS_VH';


            oModel.read(sUrl, {
                success: function (oData) {
                    this.getModel("oViewModel").setProperty("/listaViatura", oData.results);
                }.bind(this),
                error: function () {
                    MessageBox.error(this.getResourceBundle().getText("ErroCarregarViatura"));
                }
            });
        },

        //Buscar os dados do Motorista
        getMotorista: function () {
            var oModel = this.getView().getModel(),
                sUrl = '/xTQAxDRIVERS_VH';
                
            oModel.read(sUrl, {
                success: function (oData) {
                    var aFilters,
                        aListaMotorista = oData.results,
                        iSelectedTransportadora = this.getModel("oViewModel").getProperty("/selectedTransportadora/kunnr"),
                        aListaTransportadora = this.getModel("oViewModel").getProperty("/listaTransportadora");

                    if (iSelectedTransportadora) {
                        var dataTransporte = aListaTransportadora.filter(val => val.kunnr == iSelectedTransportadora)

                        aFilters = aListaMotorista.filter(val => val.company == dataTransporte[0].kunnr)
                        this.getModel("oViewModel").setProperty("/listaMotorista", aFilters)
                    } else {
                        this.getModel("oViewModel").setProperty("/listaMotorista", oData.results);
                    }
                }.bind(this),
                error: function () {
                    MessageBox.error(this.getResourceBundle().getText("ErroCarregarMotoristas"));
                }
            });
        },

        getDataHeader: function () {
            var oHeaderData = this.getModel("oViewModel").getProperty("/creatWizard");
            this.onBuildWizard(oHeaderData);
        },

        //Buscar dados para fazer o WizardSteps
        getPlanoInspecao: function () {
            var oModel = this.getView().getModel(),
                oInputViatura = this.getModel("oViewModel").getProperty("/dataPlanoInpecao/0/VALUES/5/value"),
                sUrl = `/InspectionPlanTLA(ViaturaNo='${oInputViatura}',Referencia='',MotoristaNo='',Item='',InspecaoRealizada='',IdTable='')`,
                that = this,
                oResourceBundle = that.getResourceBundle();

            oModel.read(sUrl, {
                success: function (oData) {
                    var oInspection = that.getModel("oViewModel").getProperty("/creatWizard"),
                        dataFooter = that.getModel("oViewModel").getProperty("/dataFooter"),
                        dataReinspecao = that.getModel("oViewModel").getProperty("/dataReinspecao"),
                        oSteps = JSON.parse(oData.PlanoInspecao);
                       

                    for (let i = 0; i < oSteps.length; i++) {
                        oSteps[i].VALUES = JSON.parse(oSteps[i].VALUES);
                    }

                    var creatWizard = {
                        header: [],
                        items: oSteps,
                        footer: dataFooter,
                        reinspecao: dataReinspecao
                    }

                    that.getModel("oViewModel").setProperty("/creatWizard", oInspection);
                    that.getModel("oViewModel").setProperty("/dataSteps", oSteps);
                    that.onBuildWizard(creatWizard);
                },
                error: function (oError) {
                    MessageBox.error(oResourceBundle("ErroCarregarDados"));
                }
            });
        },

        //Ver se os campos estao preenchidos
        onStepComplete: function (oEvent) {
            var aControl = [],
                aContainers = [];

            aControl.push(sap.m.Input, sap.m.Select, sap.m.DatePicker);
            aContainers.push("dadosSF");

            var fieldsChecked = this.checkEmptyFields(aControl, aContainers, "Dialog");

            if (fieldsChecked) {
                this.getModel("oViewModel").setProperty("/showNextBtn", true);
            } else {
                this.getModel("oViewModel").setProperty("/showNextBtn", false);
            }
        },

        //Contrução do Wizard
        onBuildWizard: function (pInspection) {
            var oResourceBundle = this.getResourceBundle(),
                oWizard = this.byId("MainWizard"),
                that = this,
                oStep, oStepSimpleForm,
                infoReinspection = that.getModel("oViewModel").getProperty("/TypeInspection");

            try {

                if (pInspection && pInspection.header && pInspection.header.length != 0) {
                    oStep = new sap.m.WizardStep({
                        id: pInspection.header[0].IDWIZARD,
                        title: pInspection.header[0].TITLE,
                        nextStep: pInspection.items.length === 0 ? "" : pInspection.header[0].NEXTSTEP,
                        complete: this.onStepComplete.bind(this),
                    });

                    oStepSimpleForm = new sap.ui.layout.form.SimpleForm({
                        id: pInspection.header[0].ID,
                        layout: "ColumnLayout",
                        editable: true,
                        columnsM: 2,
                        columnsL: 3,
                        columnsXL: 4
                    });


                    pInspection.header[0].VALUES.forEach(function (oItem) {
                        var oLabel = new sap.m.Label({
                            text: oResourceBundle.getText(oItem.labelText)
                        });

                        var oControl;
                        switch (oItem.type) {
                            case "selectProduoTransp":
                                oControl = new sap.m.Select({
                                    id: oItem.id,
                                    selectedKey: oItem.value,
                                    width: "200px",
                                    required: true,
                                    enabled: oItem.enabled

                                });
                                oControl.addItem(new sap.ui.core.Item({
                                    key: "001",
                                    text: oResourceBundle.getText("Combustiveis")
                                }));
                                oControl.addItem(new sap.ui.core.Item({
                                    key: "002",
                                    text: oResourceBundle.getText("Quimicos")
                                }));
                                oControl.addItem(new sap.ui.core.Item({
                                    key: "005",
                                    text: oResourceBundle.getText("Outro")
                                }));
                                break;
                            case "selectTipoInspecao":
                                oControl = new sap.m.Select({
                                    id: oItem.id,
                                    selectedKey: oItem.value,
                                    width: "200px",
                                    required: true,
                                    enabled: oItem.enabled
                                });
                                oControl.addItem(new sap.ui.core.Item({
                                    key: "001",
                                    text: oResourceBundle.getText("InicioServico")
                                }));

                                oControl.addItem(new sap.ui.core.Item({
                                    key: "002",
                                    text: oResourceBundle.getText("Periodica")
                                }));

                                oControl.addItem(new sap.ui.core.Item({
                                    key: "003",
                                    text: oResourceBundle.getText("Aleaotria")
                                }));
                                break;

                            case "inputValueHelp":
                                oControl = new sap.m.Input({
                                    id: oItem.id,
                                    showSuggestion: true,
                                    width: "200px",
                                    showValueHelp: true,
                                    valueHelpOnly: true,
                                    valueHelpRequest: this.onValueHelpRequest.bind(this, oItem.id),
                                    required: true,
                                    value: oItem.descValue,
                                    enabled: oItem.enabled
                                });
                                break;

                            case "datepicker":
                                var today = new Date();
                                var formattedDate = today.toISOString().split('T')[0];
                                oControl = new sap.m.DatePicker({
                                    id: oItem.id,
                                    width: "200px",
                                    value: formattedDate,
                                    valueFormat: "yyyyMMdd",
                                    displayFormat: "yyyy-MM-dd",
                                    required: true,
                                    enabled: oItem.enabled
                                });
                                break;

                            case "input":
                                oControl = new sap.m.Input({
                                    id: oItem.id,
                                    width: "200px",
                                    enabled: oItem.enabled,
                                    value: oItem.value,
                                    required: true,
                                    enabled: oItem.enabled
                                });
                                break;

                            case "inputKms":
                                oControl = new sap.m.Input({
                                    id: oItem.id,
                                    width: "200px",
                                    enabled: oItem.enabled,
                                    value: oItem.value,
                                    liveChange: this.onStepComplete.bind(this),
                                    type: "Number",
                                    required: true,
                                    enabled: oItem.enabled
                                });
                                break;
                        }

                        oStepSimpleForm.addContent(oLabel);
                        oStepSimpleForm.addContent(oControl);
                    }.bind(this));

                    oStep.addContent(oStepSimpleForm);
                    oWizard.addStep(oStep);
                }

                if (pInspection && pInspection.items && pInspection.items.length != 0) {

                    oWizard.getAggregation("steps")[0].setAssociation("nextStep", "wizardID1")

                    if (oWizard.getAggregation("steps")[0].getAssociation("nextStep")) {
                        this.onStepComplete()
                    }

                    pInspection.items.forEach(function (oItem, indexStep) {
                        var aParsedParam = oItem.VALUES;

                        oStep = new sap.m.WizardStep({
                            id: oItem.IDWIZARD,
                            title: oItem.TITLE,
                            nextStep: oItem.NEXTSTEP
                        });

                        oStepSimpleForm = new sap.ui.layout.form.SimpleForm({
                            id: "SF_" + oItem.IDWIZARD,
                            layout: "ResponsiveGridLayout",
                            editable: true,
                            columnsM: 2,
                            columnsL: 2,
                            columnsXL: 2
                        });

                        aParsedParam.forEach(function (oParam, index) {

                            if (index % 5 === 0) {
                                oStepSimpleForm.addContent(new sap.ui.core.Title());
                            }

                            var oLabel = new sap.m.Label({
                                text: oParam.LABELTEXT
                            });

                            var oSelectItems = new sap.m.Select({
                                selectedKey: oParam.VALORFINAL || "",
                                width: "180px",
                                required: true,
                                change: function (oEvent) {
                                    var oSelect = oEvent.getSource(),
                                        sSelectedKey = oEvent.getParameter("selectedItem").getKey(),
                                        oContext = oSelect.getBindingContext(),
                                        sPath = oContext.getPath() + "/VALORFINAL";
                                    that.getModel("oViewModel").setProperty(sPath, sSelectedKey);


                                }
                            }).setBindingContext(new sap.ui.model.Context(that.getView().getModel(), `/dataSteps/${indexStep}/VALUES/${index}`));

                            oSelectItems.addItem(new sap.ui.core.Item({
                                key: "001",
                                text: oResourceBundle.getText("ok")
                            }));

                            oSelectItems.addItem(new sap.ui.core.Item({
                                key: "002",
                                text: oResourceBundle.getText("AReparar")
                            }));

                            oSelectItems.addItem(new sap.ui.core.Item({
                                key: "005",
                                text: oResourceBundle.getText("VerObservacoes")
                            }));

                            oStepSimpleForm.addContent(oLabel);
                            oStepSimpleForm.addContent(oSelectItems);
                        });

                        oStep.addContent(oStepSimpleForm);
                        oWizard.addStep(oStep);
                    });
                }

                if (pInspection && pInspection.footer && pInspection.footer.length != 0) {

                    oStep = new sap.m.WizardStep({
                        id: pInspection.footer[0].IDWIZARD,
                        title: oResourceBundle.getText(pInspection.footer[0].TITLE),
                        nextStep: pInspection.footer[0].NEXTSTEP
                    });

                    var oContent = new sap.m.VBox({});

                    pInspection.footer[0].VALUES.forEach(function (oItem, index) {
                        if (oItem.type === "textArea") {
                            var oTextArea = new sap.m.TextArea({
                                id: "inspecaoTextArea",
                                width: "50%",
                                rows: 10,
                                placeholder: oResourceBundle.getText(oItem.labelText),
                                enabled: oItem.enabled,
                                value: oItem.value

                            });
                            oContent.addItem(oTextArea);
                        }

                        if (oItem.type === "checkBox") {
                            var oLabel = new sap.m.Label({
                                text: oResourceBundle.getText(oItem.labelText),
                                wrapping: true
                            });

                            var oCheckBox = new sap.m.CheckBox({
                                selected: !!oItem.value,
                                enabled: oItem.enabled,
                                select: function (oEvent) {
                                    var oCheckBox = oEvent.getSource(),
                                        bSelected = oEvent.getParameter("selected"),
                                        oIndex = oCheckBox.data("index");
                                    this.getModel("oViewModel").setProperty(`/dataFooter/0/VALUES/${oIndex}/value`, bSelected);
                                }
                            }).data("index", index);

                            var oCheckBoxLabel = new sap.m.Label({
                                text: oResourceBundle.getText(oItem.inspecao),
                                wrapping: true
                            });

                            var oItemsRow = new sap.m.HBox({
                                items: [oLabel, oCheckBox, oCheckBoxLabel],
                                alignItems: "Center",
                                justifyContent: "SpaceBetween",
                                wrap: "Wrap"
                            });

                            if (oItem.dateLabel !== "") {
                                var oDateLabel = new sap.m.Label({
                                    text: oResourceBundle.getText(oItem.dateLabel),
                                    wrapping: true
                                }).addStyleClass("sapUiLargeMarginBegin");

                                var formattedDate = oItem.dateValue;
                                if(formattedDate){
                                    formattedDate = oItem.dateValue.toISOString().split('T')[0]
                                }
                                var oDatePicker = new sap.m.DatePicker({
                                    id: "dataAnomaliasReinspecao",
                                    width: "200px",
                                    valueFormat: "yyyyMMdd",
                                    displayFormat: "yyyy-MM-dd",
                                    value: formattedDate,
                                    enabled: oItem.enabled


                                }).addStyleClass("sapUiTinyMarginBegin");

                                var oDatePickerHBox = new sap.m.HBox({
                                    items: [oDateLabel, oDatePicker],
                                    alignItems: "Center",
                                    justifyContent: "Start"
                                }).addStyleClass("sapUiLargeMarginBegin");

                                oItemsRow.addItem(oDatePickerHBox);
                            }

                            var oContentRow = new sap.m.VBox({
                                items: [oItemsRow],
                                alignItems: "Start",
                                justifyContent: "Start"
                            });

                            oContent.addItem(oContentRow);
                        }
                    });

                    oContent.addItem(new sap.m.Title());
                    oStep.addContent(oContent);
                    oWizard.addStep(oStep);
                    oContent.addItem(new sap.m.Title({ id: "teste1", level: "H5", wrapping: true, text: oResourceBundle.getText("NotasTitle") }));
                    oContent.addItem(new sap.m.Title({ id: "teste2", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas1") }));
                    oContent.addItem(new sap.m.Title({ id: "teste3", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas2") }));
                    oContent.addItem(new sap.m.Title({ id: "teste4", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas3") }));
                    oContent.addItem(new sap.m.Title({ id: "teste5", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas4") }));
                    oContent.addItem(new sap.m.Title({ id: "teste6", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas5") }));
                }
                if (pInspection && pInspection.reinspecao && pInspection.footer.length != 0 && infoReinspection === "R") {

                    var oContentReinspencao = new sap.m.VBox({});

                    pInspection.reinspecao[0].VALUES.forEach(function (oItem) {

                        if (oItem.type === "textArea") {
                            var oTextAreaReinspeccao = new sap.m.TextArea({
                                id: oItem.id,
                                width: "50%",
                                rows: 10,
                                placeholder: oResourceBundle.getText(oItem.labelText)
                            });

                            oContentReinspencao.addItem(new sap.m.Title({}));
                            oContentReinspencao.addItem(new sap.m.Title({}));

                            oContentReinspencao.addItem(new sap.m.Title({ level: "H6", text: oResourceBundle.getText("Reinspeccao") }));
                            oContentReinspencao.addItem(oTextAreaReinspeccao);

                        } else if (oItem.type === "checkBox") {
                            var oLabel = new sap.m.Label({
                                text: oResourceBundle.getText(oItem.labelText),
                                wrapping: true
                            });

                            var oCheckBox = new sap.m.CheckBox({
                                id: oItem.id,
                                selected: oItem.value,
                                enabled: oItem.enabled,

                            })

                            var oCheckBoxLabel = new sap.m.Label({
                                text: oResourceBundle.getText(oItem.inspecao),
                                wrapping: true
                            });

                            var oItemsRow = new sap.m.HBox({
                                items: [oLabel, oCheckBox, oCheckBoxLabel],
                                alignItems: "Center",
                                justifyContent: "SpaceBetween",
                                wrap: "Wrap"
                            });

                            var oContentRow = new sap.m.VBox({
                                items: [oItemsRow],
                                alignItems: "Start",
                                justifyContent: "Start"
                            });

                            oContentReinspencao.addItem(oContentRow);

                        } else if (oItem.type === "datepicker") {
                            var oDateLabel = new sap.m.Label({
                                text: oResourceBundle.getText(oItem.labelText),
                                wrapping: true
                            }).addStyleClass("sapUiTinyMarginEnd");

                            var oDatePickerReinspeccao = new sap.m.DatePicker({
                                id: oItem.id,
                                valueFormat: "yyyyMMdd",
                                displayFormat: "yyyy-MM-dd",
                                value: oItem.dateValue
                            });

                            var oDatePickerHBox = new sap.m.HBox({
                                items: [oDateLabel, oDatePickerReinspeccao],
                                alignItems: "Center",
                                justifyContent: "Start",
                                wrap: "Wrap",
                                layoutData: new sap.m.FlexItemData({
                                    styleClass: "sapUiTinyMarginEnd"
                                })
                            });

                            oContentReinspencao.addItem(oDatePickerHBox);
                            oContent.addItem(oContentReinspencao);
                            that.onDestroyTitles();

                            oContent.addItem(new sap.m.Title());
                            oContent.addItem(new sap.m.Title({ id: "teste1", level: "H5", wrapping: true, text: oResourceBundle.getText("NotasTitle") }));
                            oContent.addItem(new sap.m.Title({ id: "teste2", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas1") }));
                            oContent.addItem(new sap.m.Title({ id: "teste3", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas2") }));
                            oContent.addItem(new sap.m.Title({ id: "teste4", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas3") }));
                            oContent.addItem(new sap.m.Title({ id: "teste5", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas4") }));
                            oContent.addItem(new sap.m.Title({ id: "teste6", level: "H2", wrapping: true, text: oResourceBundle.getText("Notas5") }));
                        }
                    });
                } else if (infoReinspection === "I") {
                    oContentReinspencao.destroyItems();
                }


            } catch (error) {
                console.error("Erro na criação do wizard: ", error.message);
            }
        },

        onDestroyTitles: function () {
            for (let i = 1; i <= 6; i++) {

                sap.ui.getCore().byId("teste" + i).destroy();
            }
        },

        //Botao  de Confirmar
        onConfInspecao: function () {
            var TypeInspection = this.getModel("oViewModel").getProperty("/TypeInspection");

            var createTimestamp = parseInt(sessionStorage.getItem("createTimestamp"), 10),
                confirmTimestamp = new Date().getTime(),
                totalTimeInspection = confirmTimestamp - createTimestamp,
                totalTiemInspectionformated = this.timeFormat(totalTimeInspection);

            var oModel = this.getView().getModel(),
                oDataHeader = this.getModel("oViewModel").getProperty("/dataPlanoInpecao"),
                verificadorNo = sessionStorage.getItem("usrid"),
                verificador = sessionStorage.getItem("userName"),
                produtoTranspNo = sap.ui.getCore().byId("produtoTransp").getSelectedKey(),
                produtoTransp = sap.ui.getCore().byId("produtoTransp").getSelectedItem().getText(),
                motoristaNo = oDataHeader[0].VALUES.filter(item => (item.labelText === "motorista"))[0].value,
                motorista = oDataHeader[0].VALUES.filter(item => (item.labelText === "motorista"))[0].descValue,
                transportadoraNo = oDataHeader[0].VALUES.filter(item => (item.labelText === "transportadora"))[0].value,
                transportadora = oDataHeader[0].VALUES.filter(item => (item.labelText === "transportadora"))[0].descValue,
                kms = sap.ui.getCore().byId("inputKms").getValue(),
                viaturaNo = oDataHeader[0].VALUES.filter(item => (item.labelText === "viatura"))[0].value,
                viatura = oDataHeader[0].VALUES.filter(item => (item.labelText === "viatura"))[0].descValue,
                data = sap.ui.getCore().byId("datepickerData").getDateValue(),
                tipoInspecaoNo = sap.ui.getCore().byId("tipoInspecao").getSelectedKey(),
                tipoInspecao = sap.ui.getCore().byId("tipoInspecao").getSelectedItem().getText(),
                oplanoInspecao = this.getModel("oViewModel").getProperty("/dataSteps"),
                obsInpecao = sap.ui.getCore().byId("inspecaoTextArea").getValue(),
                checkFirstInspection = this.getModel("oViewModel").getProperty(`/dataFooter/0/VALUES/1/value`),
                DataFimInspecao = sap.ui.getCore().byId("dataAnomaliasReinspecao").getDateValue(),
                obsReinspecao,
                dataReinspecao,
                inspecaoCorrigidas,
                inspecaoOk = this.onCheckOk(oplanoInspecao),
                oDataReinspection;

            var tipoInspecaoString = tipoInspecao ? tipoInspecao.toString() : "",
                produtoTranspString = produtoTransp ? produtoTransp.toString() : "",
                inspecaoCorrigidasString,
                checkFirstInspectionString = checkFirstInspection ? checkFirstInspection.toString() : "";

            if (TypeInspection === "R") {

                oDataReinspection = this.getModel("oViewModel").getProperty("/oDataReinspection")
                inspecaoCorrigidas = sap.ui.getCore().byId("checkReinspecao").getSelected(),
                    inspecaoCorrigidasString = inspecaoCorrigidas ? inspecaoCorrigidas.toString() : ""
                obsReinspecao = sap.ui.getCore().byId("textAreaReinspecao").getValue()
                dataReinspecao = sap.ui.getCore().byId("datepickerDataReinspecao").getDateValue()

            } else {

                inspecaoCorrigidas = ""
                obsReinspecao = ""

            }

            for (let i = 0; i < oplanoInspecao.length; i++) {

                oplanoInspecao[i].VALUES = JSON.stringify(oplanoInspecao[i].VALUES);
            }

            var oEntry = {
                IdTable: TypeInspection === "R" ? oDataReinspection.idTable : "",
                Item: TypeInspection === "R" ? oDataReinspection.item : "",
                Referencia: TypeInspection === "R" ? oDataReinspection.referencia : "",
                TipoInspecaoNo: tipoInspecaoNo,
                TipoInspecao: tipoInspecaoString,
                ProducTranspNo: produtoTranspNo,
                ProducTransp: produtoTranspString,
                TransportadoraNo: transportadoraNo,
                Transportadora: transportadora,
                MotoristaNo: motoristaNo,
                Motorista: motorista,
                ViaturaNo: viaturaNo,
                Viatura: viatura,
                Kms: kms,
                Data: this.normalizeDate(data),
                PlanoInspecao: JSON.stringify(oplanoInspecao),
                ObsInpecao: obsInpecao,
                AnomaliaInspecao: checkFirstInspectionString,
                DataAnomaliaInspecao: this.normalizeDate(DataFimInspecao),
                InspecaoCorrigidas: inspecaoCorrigidasString,
                ObsReinspecao: obsReinspecao,
                DataReinspecao: this.normalizeDate(dataReinspecao),
                VerificadorNo: verificadorNo,
                Verificador: verificador,
                InspecaoOk: inspecaoOk,
                InspecaoRealizada: TypeInspection,
                TimeInspection: totalTiemInspectionformated
            }

            var sUrl = `/InspectionPlanTLA`,
                that = this;
            oModel.create(sUrl, oEntry, {
                success: function (oData) {
                    MessageBox.success(this.getResourceBundle().getText("Submetidocomsucesso"), {
                        actions: MessageBox.Action.OK,
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (sAction) {
                            that.onNavigation("", "RouteMain", "");
                            sessionStorage.setItem("goToLaunchpad", "X");
                            location.reload();
                        }
                    });
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Erro");
                }
            });
        },

        timeFormat: function (milliseconds) {
            var totalSeconds = Math.floor(milliseconds / 1000),
                hours = Math.floor(totalSeconds / 3600),
                minutes = Math.floor((totalSeconds % 3600) / 60),
                seconds = totalSeconds % 60;

            return [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');
        },

        normalizeDate: function (oDate) {
            if (oDate) {
                var normalizedDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 23, 59, 59);
                return normalizedDate;
            }
            return null;
        },
    });
});
