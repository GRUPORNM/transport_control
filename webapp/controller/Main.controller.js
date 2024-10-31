sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
],
    function (BaseController, JSONModel) {
        "use strict";

        return BaseController.extend("zmmtransportcontrol.controller.Main", {
            onInit: function () {
                var oViewModel = new JSONModel({
                    busy: false,
                    delay: 0,
                    oStandard: "Referencia,InspecaoRealizada,Item,Motorista,Viatura,Transportadora,Kms,Data,Verificador,StatusInspecao",
                    oSmartTableView: "",
                    variantInput: "Standard"
                });
                sessionStorage.setItem("goToLaunchpad", "X");

                this.setModel(oViewModel, "Main");
                this.getRouter().attachRouteMatched(this.getUserAuthentication, this);
            },

            //Ir para a View do Detail
            onPressInspectionDetail: function (oEvent) {
                sessionStorage.setItem("goToLaunchpad", "");
                this.onRemoveSelection();
                var oSource = oEvent.getSource(),
                    sPath = oSource.getBindingContext().getPath();

                this.onNavigation(sPath, "DetailInspection", "/ZCDS_MM_INSP_TLA");
            },

            //Botao criar Inspecao
            onCreateInspection: function () {
                sessionStorage.setItem("goToLaunchpad", "");
                sessionStorage.setItem("createTimestamp", new Date().getTime());
                this.onRemoveSelection();
                this.onNavigation("", "MainWizard", "");

            },

            //Botao da Reinspecao
            onReinspection: function (oEvent) {
                sessionStorage.setItem("goToLaunchpad", "");
                sessionStorage.setItem("createTimestamp", new Date().getTime());
                var sPath = sap.ui.getCore().byId("inspectionTable").getTable().getSelectedContextPaths()[0];

                this.onNavigation(sPath, "MainWizard", "/ZCDS_MM_INSP_TLA");
            },

            //Buscar Items
            getItemSelected: function (oEvent) {
                var oModel = this.getView().getModel(),
                    oSelectedItem = oEvent.getParameter("listItem");

                oModel.read("/InspectionPlanTLA", {
                    success: function (oData) {

                        this.onSelectionChange(oSelectedItem, oData.results);
                    }.bind(this),
                    error: function (oErro) {

                    }
                })

            },

            //Botao da Reinspecao Desabilitar ou abilitar
            onSelectionChange: function (oSelectedItem, pData) {
                var aPlanoInspection = oSelectedItem.getBindingContext().getObject(),
                    sPath =  oSelectedItem.getBindingContext().sPath,
                    regex = /IdTable='([^']+)'/,
                    match = regex.exec(sPath),
                    idTableValue = match[1],
                    filteredData = pData.filter(item => item.IdTable === idTableValue);

                var maxItemObject = filteredData.reduce((max, current) => {
                    return current.Item > max.Item ? current : max;
                });

                var oStatus = this.onCheckInspection(aPlanoInspection);

                if (aPlanoInspection.Item === maxItemObject.Item && oStatus === "") {
                    sap.ui.getCore().byId("reinspectionOperation").setEnabled(true)
                } else {
                    sap.ui.getCore().byId("reinspectionOperation").setEnabled(false)
                }
            },

            onRemoveSelection: function () {
                var oTable = sap.ui.getCore().byId("inspectionTable").getTable();
                oTable.removeSelections();
            },

            onBeforeRendering: function () {
                this.onStartVariants();
            },

            onStartVariants: function () {
                var that = this,
                    oModel = this.getModel("vModel");

                oModel.read("/xTQAxUSR_VARIANTS_DD", {
                    success: function (oData) {
                        var oResults = oData.results;
                        oResults.forEach(element => {
                            if (element.v_default) {
                                that.getModel("Main").setProperty("/variantInput", element.v_name)
                                that.getModel("Main").setProperty("/selectedVariant", element.variant_id);

                                if (element.variant_id != "Main") {
                                    var visibleInFilterBar = JSON.parse(atob(element.fbar_settings));
                                    that.onUpdateFilterBar(visibleInFilterBar);

                                    var allFieldsInVariant = JSON.parse(atob(element.stable_settings));
                                    var allNames = allFieldsInVariant.map(function (obj) {
                                        return obj.name;
                                    }).join(',');

                                    if (allNames.endsWith(',')) {
                                        allNames = allNames.substring(0, allNames.length - 1);
                                    }
                                    that.getModel("Main").setProperty("/oSmartTableView", allNames);
                                    that.onBuildSmartTable();
                                }
                                else {
                                    that.getModel("Main").setProperty("/oSmartTableView", that.getModel("Main").getProperty("/oStandard"));
                                    that.onBuildSmartTable();
                                }
                            }
                        });
                    },
                    error: function (oError) {

                    }
                });
            },

            //Construçao da SamrtTable
            onBuildSmartTable: function () {
                var oOldSmartTable = sap.ui.getCore().byId("inspectionTable");
                var oResourceBundle = this.getResourceBundle();
                if (oOldSmartTable) {
                    oOldSmartTable.destroy();
                }

                var oDestroyedSmartTable = sap.ui.getCore().byId("inspectionTable");
                if (!oDestroyedSmartTable) {
                    var oView = this.getView(),
                        oModel = this.getModel("Main");

                    var oOverflowToolbar = new sap.m.OverflowToolbar({
                        design: "Transparent",
                    });

                    var oToolbarSpacer = new sap.m.ToolbarSpacer();

                    var oCreateButton = new sap.m.Button({
                        id: "createOperation",
                        text: "{i18n>createOperation}",
                        press: this.onCreateInspection.bind(this)
                    });
                    var oReinspectionButton = new sap.m.Button({
                        id: "reinspectionOperation",
                        text: "{i18n>reinspectionOperation}",
                        enabled: false,
                        press: this.onReinspection.bind(this)
                    });

                    oOverflowToolbar.addContent(oToolbarSpacer);
                    oOverflowToolbar.addContent(oCreateButton);
                    oOverflowToolbar.addContent(oReinspectionButton);

                    var oSmartTable = new sap.ui.comp.smarttable.SmartTable({
                        id: "inspectionTable",
                        entitySet: "ZCDS_MM_INSP_TLA",
                        smartFilterId: "smartFilterBarGroups",
                        tableType: "ResponsiveTable",
                        header: "{i18n>inspectionTableTitle}",
                        showRowCount: true,
                        customToolbar: oOverflowToolbar,
                        enableAutoBinding: true,
                        initialise: function () {
                            this.onSTinitialise.bind(this);
                            var oTable = oSmartTable.getTable();
                            oTable.setMode("SingleSelectLeft");
                            oTable.attachSelectionChange(this.getItemSelected.bind(this));
                            var bSorted = false;
                            oTable.attachUpdateFinished(function () {

                                var oItems = oTable.getItems();
                                if (oItems.length > 0) {
                                    oItems.forEach(oItem => {
                                        if (oItem instanceof sap.m.ColumnListItem) {
                                            oItem.setType("Navigation");
                                            oItem.attachPress(this.onPressInspectionDetail.bind(this));
                                            var oCells = oItem.getCells();
                                            for (var i = 0; i < oCells.length; i++) {
                                                var oCell = oCells[i];

                                                if (oCell instanceof sap.m.Text) {
                                                    if (oCell.getText() === "I") {
                                                        oCell.setText(oResourceBundle.getText("Inspec"))
                                                    } else if (oCell.getText() === "R") {
                                                        oCell.setText(oResourceBundle.getText("Reisnp"))
                                                    }

                                                    if (oCell.getBindingInfo("text").binding.sPath === "StatusInspecao") {

                                                        var oObjectStatusApproved;

                                                        if (oCell.getText() === "X") {
                                                            oObjectStatusApproved = new sap.m.ObjectStatus({
                                                                text: "Sem Divergências",
                                                                state: "Indication04"
                                                            });

                                                        } else if (oCell.getText() === "") {

                                                            oObjectStatusApproved = new sap.m.ObjectStatus({
                                                                text: "Com Divergências",
                                                                state: "Indication03"

                                                            });
                                                        }
                                                        oItem.removeCell(oCell);
                                                        oItem.insertCell(oObjectStatusApproved, i);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if (!bSorted) {
                                        this.applySorting(oTable);
                                        bSorted = true;
                                    }
                                }
                            }.bind(this));

                        }.bind(this),
                        beforeRebindTable: this.onBeforeRebindTable.bind(this),
                        initiallyVisibleFields: oModel.getProperty("/oSmartTableView")
                    }).addStyleClass("sapUiSmallMarginTop");

                    var oAggregation = oView.byId("page");
                    oAggregation.setContent(oSmartTable);

                    var oToolbar = new sap.m.OverflowToolbar({
                    });
                    oSmartTable.setCustomToolbar(oToolbar);
                }
            },

            applySorting: function (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    var oSorter = new sap.ui.model.Sorter("Referencia", false, true);
                    var oSorters = [
                        oSorter,
                        new sap.ui.model.Sorter("IdTable", false)
                    ];

                    oBinding.sort(oSorters);
                }
            },

            onRouteMatched: function () {
                this.getUserAuthentication();
            },

            onFBarInitialise: function (oEvent) {
                var filterGroupItems = this.byId("smartFilterBarGroups").getFilterGroupItems(),
                    activeFiltersArray = [];

                filterGroupItems.forEach(function (item) {
                    if (item.mProperties.visibleInFilterBar) {
                        var filterInfo = {
                            name: item.mProperties.name,
                            visibleInFilterBar: item.mProperties.visibleInFilterBar
                        };
                        activeFiltersArray.push(filterInfo);
                    }
                });
                this.getModel("Main").setProperty("/vStandard", activeFiltersArray);
            },

            onSTinitialise: function (oEvent) {
                var that = this,
                    oSmartTable = oEvent.getSource(),
                    oInnerTable = oSmartTable.getTable(),
                    aColumnData = [],
                    aColumns = oInnerTable.getColumns();

                aColumns.forEach(function (oColumn) {
                    var lastIndex = oColumn.sId.lastIndexOf('-');

                    if (lastIndex !== -1) {
                        var oName = oColumn.sId.substring(lastIndex + 1);
                    }
                    aColumnData.push({
                        name: oName
                    });
                });

                that.getModel("Main").setProperty("/vSmartTableStandard", aColumnData);
            },

            onBeforeRebindTable: function (oEvent) {
                var that = this,
                    oSmartTable = oEvent.getSource(),
                    oInnerTable = oSmartTable.getTable(),
                    aNewColumnData = [],
                    aColumns = oInnerTable.getColumns();

                aColumns.forEach(function (oColumn) {
                    var lastIndex = oColumn.sId.lastIndexOf('-');

                    if (lastIndex !== -1) {
                        var oName = oColumn.sId.substring(lastIndex + 1);
                    }
                    if (oColumn.getVisible())
                        aNewColumnData.push({
                            name: oName
                        });
                });

                var isDifferent = this.checkArrayDifference(this.getModel("Main").getProperty("/oSmartTableView"), aNewColumnData);
                if (isDifferent) {
                    var oInput = this.byId("variantInput"),
                        activeFiltersJSON = JSON.stringify(aNewColumnData),
                        activeFiltersBtoa = btoa(activeFiltersJSON);

                    this.getModel("Main").setProperty("/SmartTableBtoa", activeFiltersBtoa);
                }
            },

            checkArrayDifference: function (a, b) {
                if (a.length !== b.length) {
                    return false;
                }

                var sortedA = a.slice().sort(),
                    sortedB = b.slice().sort();

                for (var i = 0; i < sortedA.length; i++) {
                    if (sortedA[i] !== sortedB[i]) {
                        return false;
                    }
                }

                return true;
            },

            onUpdateFilterBar: function (fbSettings) {
                var filterGroupItems = this.byId("smartFilterBarGroups").getFilterGroupItems();

                this.byId("smartFilterBarGroups").clear();

                filterGroupItems.forEach(oItem => {
                    oItem.setVisibleInFilterBar(false);
                });

                fbSettings.forEach(function (savedFilter) {
                    filterGroupItems.forEach(function (filterItem) {
                        if (savedFilter.name === filterItem.getName()) {
                            filterItem.setVisibleInFilterBar(true);

                            var control = filterItem.getControl();
                            var aFilters = savedFilter.aFilters;

                            if (aFilters && aFilters.length > 0) {
                                var filter = aFilters[0];
                                if (control instanceof sap.m.Input || control instanceof sap.m.MultiInput) {
                                    control.setValue("*" + filter.oValue1 + "*");
                                }
                                else if (control instanceof sap.m.Select || control instanceof sap.m.ComboBox) {
                                    control.setSelectedKey(filter.oValue1);
                                }
                                else if (control instanceof sap.m.CheckBox) {
                                    control.setSelected(filter.oValue1 === "true" || filter.oValue1 === true);
                                }
                            }
                        }
                    });
                });

            },

            onShowVariantList: function (oEvent) {
                var that = this,
                    oModel = this.getModel("vModel");

                if (!this._oPopover) {
                    var oList = new sap.m.List();
                    oList.setModel(oModel);
                    oList.bindItems({
                        path: "/xTQAxUSR_VARIANTS_DD",
                        template: new sap.m.StandardListItem({
                            title: "{v_name}"
                        })
                    });

                    oList.setMode(sap.m.ListMode.SingleSelectMaster);

                    oList.attachUpdateFinished(function () {
                        this.getItems().forEach(function (item) {
                            item.removeStyleClass("sapMSelectListItemBaseSelected");
                        });
                        this.getItems().forEach(function (item) {

                            var oBindingContext = item.getBindingContext();
                            var variant_id = oBindingContext.getProperty("variant_id");
                            var selectedV = that.getModel("Main").getProperty("/selectedVariant");
                            if (!selectedV) {
                                if (variant_id === "Main") {
                                    item.addStyleClass("sapMSelectListItemBaseSelected");
                                }
                            }
                            else {
                                if (variant_id === selectedV) {
                                    item.addStyleClass("sapMSelectListItemBaseSelected");
                                    that.byId("variantInput").setValue(oBindingContext.getProperty("v_name"));
                                }
                            }
                        });
                    });

                    oList.attachSelectionChange(function (oEvent) {
                        this.getItems().forEach(function (item) {
                            item.removeStyleClass("sapMSelectListItemBaseSelected");
                        });

                        var oListItem = oEvent.getParameter("listItem");
                        oListItem.addStyleClass("sapMSelectListItemBaseSelected");

                        var oBindingContext = oListItem.getBindingContext();
                        var selectedVariant = oBindingContext.getProperty("variant_id");

                        that.getModel("Main").setProperty("/selectedVariant", selectedVariant);
                        that.byId("variantInput").setValue(oBindingContext.getProperty("v_name"));

                        if (selectedVariant != "Main") {
                            var oObject = that.getModel("vModel").getObject(oBindingContext.sPath),
                                filterBarAtob = atob(oObject.fbar_settings),
                                filterBarArray = JSON.parse(filterBarAtob);
                            that.onUpdateFilterBar(filterBarArray);

                            var allFieldsInVariant = JSON.parse(atob(oObject.stable_settings));
                            var allNames = allFieldsInVariant.map(function (obj) {
                                return obj.name;
                            }).join(',');

                            // Remove a última vírgula, se necessário
                            if (allNames.endsWith(',')) {
                                allNames = allNames.substring(0, allNames.length - 1);
                            }

                            that.getModel("Main").setProperty("/oSmartTableView", allNames);
                            that.onBuildSmartTable();
                        }
                        else {
                            that.onUpdateFilterBar(that.getModel("Main").getProperty("/vStandard"));
                            that.getModel("Main").setProperty("/oSmartTableView", that.getModel("Main").getProperty("/oStandard"));
                            that.onBuildSmartTable();
                        }
                        that._oPopover.close();
                    });


                    this._oPopover = new sap.m.ResponsivePopover({
                        contentWidth: "25%",
                        title: this.getView().getModel("i18n").getResourceBundle().getText("MyViews"),
                        placement: "Bottom",
                        beginButton: new sap.m.Button({
                            text: this.getView().getModel("i18n").getResourceBundle().getText("SaveAs"),
                            type: "Emphasized",
                            press: function () {
                                that.onBeforeSaveVariant();
                                this._oPopover.close();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: this.getView().getModel("i18n").getResourceBundle().getText("Manage"),
                            press: function () {
                                that.onManageViews();
                                this._oPopover.close();
                            }.bind(this)
                        }),
                        content: [oList]
                    });
                }

                this._oPopover.openBy(oEvent.getSource());
            },

            onManageViews: function () {
                if (!this._oManageDialog) {
                    var oModel = this.getModel("vModel")
                    var oSearchBar = new sap.m.SearchField({
                        width: "100%",
                        placeholder: this.getView().getModel("i18n").getResourceBundle().getText("Search"),
                        liveChange: function (oEvent) {

                            var sQuery = oEvent.oSource.getValue();
                            var oFilter = new sap.ui.model.Filter("v_name", sap.ui.model.FilterOperator.Contains, sQuery);
                            oTable.getBinding("items").filter([oFilter]);
                        }
                    });

                    var oTable = new sap.m.Table({
                        columns: [
                            new sap.m.Column({ header: new sap.m.Label({ text: this.getView().getModel("i18n").getResourceBundle().getText("VariantName") }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: this.getView().getModel("i18n").getResourceBundle().getText("Default") }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: this.getView().getModel("i18n").getResourceBundle().getText("CreatedAt") }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: "" }) })
                        ]
                    });
                    oTable.setModel(oModel);

                    oTable.bindItems({
                        path: "/xTQAxUSR_VARIANTS_DD",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{v_name}" }),
                                new sap.m.CheckBox({
                                    enabled: {
                                        path: 'variant_id',
                                        formatter: function (value) {
                                            if (value == "Main")
                                                return false;
                                        }
                                    },
                                    selected: "{v_default}",
                                    select: function (oEvent) {
                                        var oCheckBox = oEvent.getSource();
                                        var oContext = oCheckBox.getBindingContext();
                                        var selectedState = oCheckBox.getSelected();

                                        var oEntry = {};
                                        oEntry.v_default = selectedState;

                                        oModel.update(oContext.sPath, oEntry, {
                                            success: function (oCreatedData) {
                                                oModel.refresh(true);
                                            },
                                            error: function (oError) {

                                            }
                                        });
                                    }
                                }),
                                new sap.m.Text({
                                    text: {
                                        path: "created_at",
                                        type: new sap.ui.model.type.Date({
                                            pattern: "dd-MM-yyyy"
                                        })
                                    }
                                }),
                                new sap.m.Button({
                                    icon: "sap-icon://decline",
                                    visible: {
                                        path: 'v_name',
                                        formatter: function (variantName) {
                                            if (variantName == "Standard") {
                                                return false;
                                            }
                                        }
                                    },
                                    press: function (oEvent) {
                                        var oCheckBox = oEvent.getSource();
                                        var oContext = oCheckBox.getBindingContext();

                                        oModel.remove(oContext.sPath, {
                                            success: function (oCreatedData) {
                                            },
                                            error: function (oError) {
                                            }
                                        });
                                    }
                                })
                            ]
                        })
                    });

                    this._oManageDialog = new sap.m.Dialog({
                        title: this.getView().getModel("i18n").getResourceBundle().getText("Manageviews"),
                        content: [oSearchBar, oTable],
                        beginButton: new sap.m.Button({
                            text: this.getView().getModel("i18n").getResourceBundle().getText("Close"),
                            press: function () {
                                this._oManageDialog.close();
                            }.bind(this)
                        })
                    });
                }

                this._oManageDialog.open();
            },

            onBeforeSaveVariant: function () {
                var that = this;
                var oVariantName = new sap.m.Input({
                    id: "inVariantName"
                });

                var oCheckBox = new sap.m.CheckBox({
                    text: this.getView().getModel("i18n").getResourceBundle().getText("SetDefault")
                });

                var oDialog = new sap.m.Dialog({
                    title: this.getView().getModel("i18n").getResourceBundle().getText("SaveView"),
                    content: [
                        new sap.ui.layout.form.SimpleForm({
                            editable: true,
                            layout: "ResponsiveGridLayout",
                            content: [
                                new sap.m.Label({
                                    text: this.getView().getModel("i18n").getResourceBundle().getText("View")
                                }),
                                oVariantName,
                                oCheckBox
                            ]
                        })
                    ],
                    buttons: [
                        new sap.m.Button({
                            text: this.getView().getModel("i18n").getResourceBundle().getText("Save"),
                            type: "Emphasized",
                            press: function () {
                                that.onSaveVariant(oVariantName.getValue(), oCheckBox.getSelected());
                                oDialog.destroy();
                            }
                        }),
                        new sap.m.Button({
                            text: this.getView().getModel("i18n").getResourceBundle().getText("Close"),
                            press: function () {
                                oDialog.close();
                                oDialog.destroy();
                            }
                        })
                    ]
                });

                oDialog.open();
            },

            onSaveVariant: function (VariantName, vDefault) {
                var that = this,
                    oModel = this.getModel("vModel"),
                    oEntry = {},
                    oFilterBarContext = [],
                    oFilterBar = this.byId("smartFilterBarGroups"),
                    filterGroupItems = oFilterBar.getFilterGroupItems(),
                    activeFiltersArray = [];

                filterGroupItems.forEach(function (item) {
                    if (item.mProperties.visibleInFilterBar) {
                        var filterInfo = {
                            name: item.mProperties.name,
                            visibleInFilterBar: item.mProperties.visibleInFilterBar
                        };
                        activeFiltersArray.push(filterInfo);
                    }
                });

                var activeFiltersJSON = JSON.stringify(activeFiltersArray),
                    activeFiltersBtoa = btoa(activeFiltersJSON);

                this.getModel("Main").setProperty("/fbarBtoa", activeFiltersBtoa);
                var oFilterAvailable = JSON.parse(atob(this.getModel("Main").getProperty("/fbarBtoa")));

                oFilterBar.getFilters().forEach(element => {
                    var aFilters = element.aFilters;

                    var oMatchingFilter = oFilterAvailable.find(fs => fs.name === aFilters[0]?.sPath);

                    if (oMatchingFilter) {
                        oMatchingFilter.aFilters = aFilters.length > 0 ? aFilters : " ";

                    }
                });

                oEntry.v_name = VariantName;

                if (this.getModel("Main").getProperty("/fbarBtoa"))
                    oEntry.fbar_settings = btoa(JSON.stringify(oFilterAvailable));
                else
                    oEntry.fbar_settings = btoa(JSON.stringify(this.getModel("Main").getProperty("/vStandard")));
                if (this.getModel("Main").getProperty("/SmartTableBtoa")) {
                    oEntry.stable_settings = this.getModel("Main").getProperty("/SmartTableBtoa");
                }
                else {
                    var oTable = sap.ui.getCore().byId("inspectionTable").getTable(),
                        aColumnData = [],
                        aColumns = oTable.getColumns();

                    aColumns.forEach(function (oColumn) {
                        var lastIndex = oColumn.sId.lastIndexOf('-');

                        if (lastIndex !== -1) {
                            var oName = oColumn.sId.substring(lastIndex + 1);
                        }
                        if (oColumn.getVisible())
                            aColumnData.push({
                                name: oName
                            });
                    });

                    oEntry.stable_settings = btoa(JSON.stringify(aColumnData));
                }
                oEntry.app_link = 'STOCK_MANAGE';
                oEntry.v_default = vDefault;

                oModel.create("/xTQAxUSR_VARIANTS_DD", oEntry, {
                    success: function (oCreatedData) {
                        that.getModel("Main").setProperty("/selectedVariant", oCreatedData.variant_id);
                    },
                    error: function (oError) {

                    }
                });
            },

            onFilterChange: function (oEvent) {
                var filterGroupItems = oEvent.oSource.getFilterGroupItems(),
                    activeFiltersArray = [];

                filterGroupItems.forEach(function (item) {
                    if (item.mProperties.visibleInFilterBar) {
                        var filterInfo = {
                            name: item.mProperties.name,
                            visibleInFilterBar: item.mProperties.visibleInFilterBar
                        };
                        activeFiltersArray.push(filterInfo);
                    }
                });

                var activeFiltersJSON = JSON.stringify(activeFiltersArray),
                    activeFiltersBtoa = btoa(activeFiltersJSON);
                this.getModel("Main").setProperty("/fbarBtoa", activeFiltersBtoa);

            },

        });
    });
