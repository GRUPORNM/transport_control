sap.ui.define(
    [
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "../model/formatter"
    ],
    function (BaseController, JSONModel, formatter) {
        "use strict";

        return BaseController.extend("zmmtransportcontrol.controller.DetailInspection", {
            formatter: formatter,

            onInit: function () {
                var oViewModel = new JSONModel({
                    busy: false,
                    delay: 0,
                    ResultadoInspecao: {},
                    DivergenciasDetectadas: ""
                });
                this.setModel(oViewModel, "oDetailModel");
                sap.ui.core.UIComponent.getRouterFor(this).getRoute("DetailInspection").attachPatternMatched(this.onObjectMatched, this);
                sessionStorage.setItem("goToLaunchpad", "X");

            },

            onAfterRendering: function () {
                var that = this;
                sessionStorage.setItem("goToLaunchpad", "");
                window.addEventListener("message", function (event) {
                    var data = event.data;
                    if (data.action == "goToMainPage") {
                        that.onNavBack();
                    }
                });
            },
        });
    }
);
