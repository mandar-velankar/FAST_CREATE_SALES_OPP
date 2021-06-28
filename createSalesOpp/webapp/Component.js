// if(location.hostname.indexOf("localhost")>-1){
// 	jQuery.sap.registerModulePath("com.bayer.tender.createsalesopportunity", "/createsalesopportunity/webapp");
// 	// jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts/webapp"); 
// 	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib/src/com/bayer/tender/uilib"); 
// 	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib","/uilib/src/com/bayer/tender/uilib");
// 	// jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender/webapp"); 
// }else{
// 	jQuery.sap.registerModulePath("com.bayer.tender.createsalesopportunity", "/createsalesopportunity");
// 	// jQuery.sap.registerModulePath("com.bayer.tender.ppa", "/ppa");
// 	// jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts"); 
// 	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib"); 
// 	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib","/uilib");
// 	// jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender"); 
// }
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"./model/models",
	"./controller/ListSelector",
	"./controller/ErrorHandler",
	"./service/SoaService",
	"./state/SoaState",
	'sap/f/FlexibleColumnLayoutSemanticHelper',
	'sap/f/library'
], function (UIComponent, Device, models, ListSelector, ErrorHandler, SoaService, SoaState, FlexibleColumnLayoutSemanticHelper, fioriLibrary) {
	"use strict";

	return UIComponent.extend("com.bayer.tender.createsalesopportunity.Component", {

		metadata : {
			manifest : "json"
		},
		SOA: "soa",

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init : function () {
			this.oListSelector = new ListSelector();
			this._oErrorHandler = new ErrorHandler(this);

			// Service & State
			this.soaService = new SoaService(this.getModel());
			this.soaState = new SoaState(this.soaService);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		getState: function (stateName) {
			return this[stateName + "State"];
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy : function () {
			this.oListSelector.destroy();
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		getHelper: function () {
			return this._getFcl().then(function(oFCL) {
				var oSettings = {
					defaultTwoColumnLayoutType: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
					initialColumnsCount: 2
				};
				return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings));
			});
		},

		_getFcl: function () {
			return new Promise(function(resolve, reject) {
				var oFCL = this.getRootControl().byId('layout');
				if (!oFCL) {
					this.getRootControl().attachAfterInit(function(oEvent) {
						resolve(oEvent.getSource().byId('layout'));
					}, this);
					return;
				}
				resolve(oFCL);

			}.bind(this));
		}

	});
});