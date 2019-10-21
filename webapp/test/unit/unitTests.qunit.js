/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"LMBR_CUSTOMER_APP/queue_analysis/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});