/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zmb51ui/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
