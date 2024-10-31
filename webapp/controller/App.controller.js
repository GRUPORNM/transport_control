sap.ui.define(
  [
    "./BaseController", 
    "sap/ui/model/json/JSONModel"
  ],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("zmmtransportcontrol.controller.App", {
      
      onInit: function () {
        this.setModel(new JSONModel({}), "appView");

        var urlParams = new URLSearchParams(window.location.search);
        var token = urlParams.get('token');
        this.setModelTQA(token);

        if (!sessionStorage.getItem("oLangu"))
          sap.ui.getCore().getConfiguration().setLanguage("EN");
        else {
          sap.ui.getCore().getConfiguration().setLanguage(sessionStorage.getItem("oLangu"));
        }
      }
    });
  }
);
