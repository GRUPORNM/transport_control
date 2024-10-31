/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zmm_transport_control/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
