sap.ui.define([], function () {
    "use strict";

    return {
        dateFormat: function (oDate) {

            if (oDate != null) {
                var oDate = (oDate instanceof Date) ? oDate : new Date(oDate);
                var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy" });

                return dateFormat.format(oDate);
            }
        },
    };
});