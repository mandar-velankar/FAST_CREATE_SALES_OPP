sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/model/FilterType",
	"sap/ui/core/BusyIndicator",
	"../model/formatter",
	"../utils/OpportunityFormatter"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, FilterType, BusyIndicator, formatter,OpportunityFormatter) {
	"use strict";

	return BaseController.extend("com.bayer.tender.createsalesopportunity.controller.Master", {

		formatter: formatter,
		OpportunityFormatter:OpportunityFormatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oGroupFunctions = {
				CodigoEstado: function (oContext) {
					var iNumber = oContext.getProperty('TenderReference'),
						key, text;
					if (iNumber <= 20) {
						key = "LE20";
						text = this.getResourceBundle().getText("masterGroup1Header1");
					} else {
						key = "GT20";
						text = this.getResourceBundle().getText("masterGroup1Header2");
					}
					return {
						key: key,
						text: text
					};
				}.bind(this)
			};

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});


			this.soaState = this.getOwnerComponent().getState(this.getOwnerComponent().SOA);
			this.setModel(this.soaState.getModel(), "soa");

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			this.getCountries().then(() => {
				this.byId("idSlctCountry").setSelectedKey(this.soaState.data.countries[0].CountryCode)
				this.setFilter();
				let sCountryCode = this.byId("idSlctCountry").getSelectedItem().getKey();

				this.soaState.loadCountryChannels(sCountryCode);
				this.soaState.loadCountryClassifications(sCountryCode);
				this.soaState.loadCountryTenderTypes(sCountryCode);
			})
			.catch((error) => { });


			
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		// /**
		//  * Event handler for the master search field. Applies current
		//  * filter value and triggers a new search. If the search field's
		//  * 'refresh' button has been pressed, no new search is triggered
		//  * and the list binding is refresh instead.
		//  * @param {sap.ui.base.Event} oEvent the search event
		//  * @public
		//  */
		// onSearch: function (oEvent) {
		// 	if (oEvent.getParameters().refreshButtonPressed) {
		// 		// Search field's 'refresh' button has been pressed.
		// 		// This is visible if you select any master list item.
		// 		// In this case no new search is triggered, we only
		// 		// refresh the list binding.
		// 		this.onRefresh();
		// 		return;
		// 	}

		// 	var sQuery = oEvent.getParameter("query");

		// 	if (sQuery) {
		// 		this._oListFilterState.aSearch = [new Filter("Name", FilterOperator.Contains, sQuery)];
		// 	} else {
		// 		this._oListFilterState.aSearch = [];
		// 	}
		// 	this._applyFilterSearch();

		// },

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "sort";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "com.bayer.tender.createsalesopportunity.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function (oItem) {
				switch (oItem.getKey()) {
					case "distributor":
						aFilters.push(new Filter("TenderChannel", FilterOperator.EQ, "Distributor"));
						break;
					case "rfq":
						aFilters.push(new Filter("Classification", FilterOperator.EQ, "RFQ"));
						break;
					default:
						break;
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			// apply sorter to binding
			// (grouping comes before sorting)
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._oGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function (oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Name",
				groupBy: "None"
			});
		},

		_onMasterMatched: function () {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
			/*this.getCountries().then(() => {
				this.setFilter();
			})
			.catch((error) => { });*/
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			// this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.soaState.setEditMode(false);

			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ID"),
				layout: "TwoColumnsMidExpanded"
			}, bReplace);
		},

		onAdd: function (){
			this.soaState.setEditMode(true);
			var bReplace = !Device.system.phone;
			let sId = this.soaState.getNewUUID();
			let sCountryCode = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : "";
			if(sCountryCode === ""){
				//user should select a country first from the filter. Show error message.
				sap.m.MessageBox.error(`Please select a country first, for which you would like to create a new opportunity.`, {
					title: "Country missing"
				});
			} else {
				this.soaState.createNewOpportunityObject(sId, sCountryCode);
				this.soaState.setCreationMode(true);

				this.getRouter().navTo("object", {
					objectId: sId,
					layout: "TwoColumnsMidExpanded"
				}, bReplace);
			}
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		/**
		 * Creates an opportunity object in the State
		 * @param {string} sObjectPath - the path of the selected object
		 * @returns {object} - On opportunity object
		 */
		createStateObject: function (selectedObj) {

			// expand Comprador and Items
			selectedObj["Institute"] = selectedObj.Institute && this.getView().getModel().getObject(`/${selectedObj.Institute.__ref}`);
			selectedObj["Products"]["results"] = selectedObj.Products && selectedObj.Products.__list.map(path => this.getView().getModel().getObject(`/${path}`));

			return this.soaState.createOpportunity(selectedObj);

		},

		/* handling participate button press */
		onParticipateOpportunityPress: async function (oEvent) {
			this.soaState.onParticipateOpportunity(oEvent.getSource().getBindingContext(), this.getView());
			let oParticipationDialog = await this.soaState.getParticipationDialog(this.getView());
			oParticipationDialog.open();
		},

		onCancelParticipation: function (oEvent) {
			this.soaState.onCancelParticipation();
			this.soaState.clearSelectedOpportunity();
		},

		onSaveParticipation: async function () {
			await this.soaState.onSaveParticipation();
			this.getView().byId('list').getModel().refresh(true);
			this._oList.getBinding("items").refresh(true);
		},

		/* Filtering & sorting functionalities */
		setFilter: function (oSelection) {

			var oCountry = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : "";
			var sSearch = this.byId("idSearch").getProperty("value");
			var sStatus = this.byId("idSlctStatusFilter").getSelectedKey();
			var sSubStatus = this.byId("idSlctSubStatusFilter").getSelectedKey();

			//Add filters if they are set (so not the default, all...)
			var orFilters = [];
			var andFilters = [];

			if (oCountry != ""){
				andFilters.push(new sap.ui.model.Filter("CountryCode", "EQ", oCountry));
			}
			if (sStatus) {
				andFilters.push(new sap.ui.model.Filter("MainStatus", "EQ", sStatus));
			}

			if (sSubStatus && sSubStatus != 'NA') {
				andFilters.push(new sap.ui.model.Filter("SubStatus", "EQ", sSubStatus));
			}
			//oSelection is empty when you are navigating back to the tender list after selecting a tender
			// let sIdSource = "";
			// if (oSelection) {
			// 	sIdSource = oSelection.getSource().getId();
			// }

			if (sSearch.length > 0) {

				orFilters.push(new Filter({
					path: "TenderReference",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "Classification",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "TenderChannel",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				andFilters.push(new sap.ui.model.Filter(orFilters, false));
			}

			var oFilters = (andFilters.length > 0 && new sap.ui.model.Filter(andFilters, true)) || [];

			//Binding to table with the filters and the sorters
			this.getView().byId("list").getBinding("items").filter(oFilters, FilterType.Application);


		},

		/**
		 * Get list of countries 
		 */
		 getCountries: function(){
			this.getView().setBusy(true);

			return this.soaState.getCountries()
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				this.getView().setBusy(true);
				this.showNoAccessMessage("User ID doesn't have access");
				throw(error);
			});
		},

		/* handle search helps */
		handleValueHelp: async function (oEvent) {
			let sCountryCode = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : "CL";
			await this.soaState.loadCountryInstitutes(sCountryCode, this.byId('idInstTypeTender').getSelectedKey());

			var oView = this.getView();
			this._sInputId = this.byId('idInstituteName').getId();

			// create value help dialog
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "com.bayer.tender.createsalesopportunity.view.fragments.InstitutesSearchHelp",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			// open value help dialog
			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.open();
			});
		},

		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"InstituteName",
				FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (oEvent) {
			let sCountryCode = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : "CL";
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oInputfield = this.byId(this._sInputId);
				oInputfield.setValue(oSelectedItem.getTitle());

				if (this._sInputId.includes("InstituteNameOpp")) {
					const oOpportunity = this.soaState.getSelectedOpportunity();
					oOpportunity.instituteID = Number(oSelectedItem.getDescription());
					oOpportunity.institute.instituteName = oSelectedItem.getTitle();
					oOpportunity.institute_InstituteID = Number(oSelectedItem.getDescription());
					oOpportunity.institute_CountryCode = sCountryCode;
				}
				else if (this._sInputId.includes("InstituteName")) {
					const oTender = this.soaState.getNewTender();
					oTender.instituteID = Number(oSelectedItem.getDescription());
				}
			}
			oEvent.getSource().getBinding("items").filter([]);
			this._sInputId = "";
		}

		/* end of search help handlers */
	});

});