sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../model/formatter",
	"sap/ui/core/BusyIndicator",
	"sap/m/library"
], function (BaseController, JSONModel, MessageBox, formatter, BusyIndicator, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.createsalesopportunity.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				isProductDetailVisible: false
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			this.soaState = this.getOwnerComponent().getState(this.getOwnerComponent().SOA);
			this.setModel(this.soaState.getModel(), "soa");
			this.oObjectPageLayout = this.byId("DetailPage");
			this.soaState.setDetailPage(this.oObjectPageLayout);

			/*this.soaState.loadCountryChannels("CL");
			this.soaState.loadCountryClassifications("CL");
			this.soaState.loadCountryTenderTypes("CL");*/ //currently done in master, no need to do it again here
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},


		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {

			// removes the selection of the products table. This is needed to always be able to click on the item.
			this.byId("ProductsTableID").removeSelections();

			this.oObjectPageLayout.setShowFooter(this.soaState.getEditMode());
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			let layout = oEvent.getParameter("arguments").layout;
			this.getModel("appView").setProperty("/layout", layout);
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("PublicSalesOpportunities", {
					ID: this.sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			const opportunity = this.createStateObject(sObjectPath);
			this.soaState.setSelectedOpportunity(opportunity);
		},

		/**
		 * Creates an opportunity object in the State
		 * @param {string} sObjectPath - the path of the selected object
		 * @returns {object} - On opportunity object
		 */
		createStateObject: function (sObjectPath) {

			const selectedObj = this.getView().getModel().getObject(sObjectPath);
			if(!selectedObj){
				return this.soaState.getSelectedOpportunity(); //we're handling a new opportunity
			}

			// expand Comprador and Items
			if(selectedObj){
				selectedObj["Institute"] = selectedObj.Institute && this.getView().getModel().getObject(`/${selectedObj.Institute.__ref}`);
				selectedObj["Products"]["results"] = selectedObj.Products && selectedObj.Products.__list.map(path => this.getView().getModel().getObject(`/${path}`));
			}

			return this.soaState.createOpportunity(selectedObj);

		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
			this.soaState.clearSelectedOpportunity();
			this.soaState.setEditMode(false);
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		onParticipateOpportunityPress: async function (oEvent) {
			let oSelectedOpportunity = this.soaState.getSelectedOpportunity();
			if (oSelectedOpportunity.mainStatus === "Participated") {
				this.openTender(oSelectedOpportunity.tenderID);
				return true;
			}

			await this.soaState.setTemporaryTender('CL');
			this._getParticipationDialog().open();
		},

		openTender:function(tenderId){
			window.open("/app/#/tender&/t/detail/CL/" + tenderId + "//__component0---tenderManagementDetailId--basicInformationId//TwoColumnsMidExpanded");
		},
		/**
		 * New contracting dialog
		 * @returns {dialog} - oDialog
		 */
		_getParticipationDialog: function () {
			//create new dialog if not yet existing
			if (!this._oParticipationDialog) {

				let oView = this.getView();
				let that = this;

				//get dialog
				/*this._oParticipationDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "com.bayer.tender.createsalesopportunity.view.fragments.OpportunityInfo",
					controller: this
				}).then(function (oParticipationDialog) {
					oView.addDependent(that._oParticipationDialog);
					return oParticipationDialog;
				});*/
				this._oParticipationDialog = sap.ui.xmlfragment(this.getView().getId(), "com.bayer.tender.createsalesopportunity.view.fragments.OpportunityInfo", this);
				this.getView().addDependent(this._oParticipationDialog);
			}

			return this._oParticipationDialog;
		},

		onCancelParticipation: function (oEvent) {
			this._oParticipationDialog.close();
		},

		onSaveParticipation: async function () {

			const oTender = this.soaState.getNewTender();
			var that = this;

			if (this._validateNewTender(oTender)) {
				try {
					BusyIndicator.show(0);
					await this.soaState.createTender(oTender);
					BusyIndicator.hide()
					this._oParticipationDialog.close();
					this.getModel().refresh();

					let opp = that.soaState.getSelectedOpportunity();
					opp.mainStatus = "Participated";
					that.soaState.setSelectedOpportunity(opp);
					sap.m.MessageToast.show("Tender creation done...");
					//successfully created tender
					MessageBox.success("Tender created with ID (" + oTender.tenderID + ").", {
						actions: ["Go to new Tender", MessageBox.Action.CLOSE],
						styleClass: "sapUiSizeCompact",
						onClose: function (sAction) {
							if (sAction !== MessageBox.Action.CLOSE) {
								// window.open("http://localhost:8080/landingspage/webapp/index.html#/tender&/t/detail/CL/" + oTender.tenderID + "//__component0---tenderManagementDetailId--basicInformationId//TwoColumnsMidExpanded");
								window.open("/app/#/tender&/t/detail/CL/" + oTender.tenderID + "//__component0---tenderManagementDetailId--basicInformationId//TwoColumnsMidExpanded");
							}
						}
					});

				} catch (error) {
					console.error(error);
					BusyIndicator.hide()
				}
			}
		},

		_validateNewOpportunity: function (oOpportunity) {

			//TODO: move to state

			var bValid = true;
			var bWarning = false;
			var aMessages = [];

			//check mandatory fields
			if (
				oOpportunity.tenderReference === "" ||
				oOpportunity.classification === "" ||
				//oTender.instituteID === "" || //IntituteType is property of institute
				oOpportunity.tenderChannel === "" ||
				!oOpportunity.publicationDate ||
				!oOpportunity.offerDueDate ||
				!oOpportunity.nextPublicationDate
				) {

				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Mandatory fields.',
					description: '- Tender Reference \n' +
						'- Classification \n' +
						'- Institute \n' +
						'- Channel \n' +
						'- Publication Date \n' +
						'- Offer due Date \n',
					subtitle: 'Please enter all the mandatory fields..',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;

			}

			//check if dates are correct
			if (!moment(oOpportunity.publicationDate).isBefore(oOpportunity.offerDueDate)) {

				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Publication Date',
					description: 'Publication date should be before the offer due date. \n',
					subtitle: 'Publication date should be before the offer due date.',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;
			}

			//check if dates are correct
			if (oOpportunity.expectedAwardDate) { //optional date

				if (!moment(oOpportunity.offerDueDate).isBefore(oOpportunity.expectedAwardDate)) {

					//add error message
					var oMessage = {
						type: 'Error',
						title: 'OfferDuedate',
						description: 'Offer due date should be before the Award date. \n',
						subtitle: 'OfferDuedate date should be before the Award date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}
			}

			//check if dates are correct
			if (oOpportunity.expectedAwardDate && oOpportunity.nextPublicationDate) { //optional dates

				if (!moment(oOpportunity.expectedAwardDate).isBefore(oOpportunity.nextPublicationDate)) {
					//add error message
					var oMessage = {
						type: 'Error',
						title: 'Award date',
						description: 'Award date should be before the next publication date. \n',
						subtitle: 'Award date should be before the next publication date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}

			}

			//if errors (or warnings) occured, show the messages in 1 dialog
			if (!bValid || bWarning) {

				//if this check is performed for the original tender that we clone from
				var sTitle = 'Error';

				//Show error messages
				this.soaState.showMessageCompositeView(sTitle, aMessages, 'Error');
			}

			return bValid;
		},

		_validateNewTender: function (oTender) {

			//TODO: move to state

			var bValid = true;
			var bWarning = false;
			var aMessages = [];

			//check mandatory fields
			if (
				oTender.tenderName === "" ||
				oTender.classification === "" ||
				oTender.instituteID === "" || //IntituteType is property of institute
				oTender.tenderChannel === "" ||
				oTender.groupPurchasing === "" ||
				!oTender.publicationDate ||
				!oTender.bidDueDate ||
				!oTender.nextPublicationDye || 
				!oTender.awardDate) {

				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Mandatory fields.',
					description: '- Tender Name \n' +
						'- Classification \n' +
						'- Institute \n' +
						'- Channel \n' +
						'- Group Purchasing \n' +
						'- Publication Date \n' +
						'- Bid due Date \n',
					subtitle: 'Please enter all the mandatory fields..',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;

			}

			//check if dates are correct
			if (!moment(oTender.publicationDate).isBefore(oTender.bidDueDate)) {

				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Publication Date',
					description: 'Publication date should be before the offer due date. \n',
					subtitle: 'Publication date should be before the offer due date.',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;
			}

			//check if dates are correct
			if (oTender.AwardDate) { //optional date

				if (!moment(oTender.bidDueDate).isBefore(oTender.awardDate)) {

					//add error message
					var oMessage = {
						type: 'Error',
						title: 'OfferDuedate',
						description: 'OfferDuedate date should be before the Award date. \n',
						subtitle: 'OfferDuedate date should be before the Award date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}
			}

			//check if dates are correct
			if (oTender.awardDate && oTender.nextPublicationDye) { //optional dates

				if (!moment(oTender.awardDate).isBefore(oTender.nextPublicationDye)) {
					//add error message
					var oMessage = {
						type: 'Error',
						title: 'Award date',
						description: 'Award date should be before the next publication date. \n',
						subtitle: 'Award date should be before the next publication date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}

			}

			//check if dates are correct
			if (oTender.BidDueDate && oTender.InternalBidDueDate) { //optional dates

				if (!moment(oTender.internalBidDueDate).isBefore(oTender.bidDueDate)) {
					//add error message
					var oMessage = {
						type: 'Error',
						title: 'Internal due date',
						description: 'Internal due date should be before the offer due date. \n',
						subtitle: 'Internal due date should be before the offer due date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}
			}

			//if errors (or warnings) occured, show the messages in 1 dialog
			if (!bValid || bWarning) {

				//if this check is performed for the original tender that we clone from
				var sTitle = 'Error';

				//Show error messages
				this.soaState.showMessageCompositeView(sTitle, aMessages, 'Error');
			}

			return bValid;
		},

		/**
		 * Go to edit mode
		 */
		onEditModePress: function (oEvent) {
			this.soaState.setEditMode(true);
			this.oObjectPageLayout.setShowFooter(true);
		},

		onTenderMatchingStatusChange: function (oEvent) {
			const status = oEvent.getParameter("state") ? 'In' : 'Out';
			this.soaState.setTenderMatchingStatus(status);
		},

		onFooterCancelPress: function () {
			this.soaState.setEditMode(false);
			this.soaState.restoreBackup();
			this.oObjectPageLayout.setShowFooter(false);
		},

		onFooterSavePress: function () {

			this.getView().setBusy(true);
			this.getView().setBusyIndicatorDelay(0);

			if(this._validateNewOpportunity(this.soaState.getSelectedOpportunity())){
				this.soaState.saveSelectedOpportunity().then(() => {
					this.getView().setBusy(false);
					this.getView().getModel().refresh();
					this.soaState.setEditMode(false);
					this.oObjectPageLayout.setShowFooter(false);
					sap.m.MessageToast.show("Opportunity saved successfully...");
				});
			} else {
				this.getView().setBusy(false);
			}
		},

		/* handle search helps */
		handleValueHelp: async function (oEvent) {
			await this.soaState.loadCountryInstitutes('CL', this.byId('idInstituteType').getSelectedKey());

			var oView = this.getView();
			let oInstituteInputField = this.byId('idInstituteName');
			if(!oInstituteInputField){
				oInstituteInputField = this.byId('idInstituteNameOpp');
			}

			this._sInputId = oInstituteInputField.getId();

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
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oInputfield = this.byId(this._sInputId);
				oInputfield.setValue(oSelectedItem.getTitle());

				if (this._sInputId.includes("InstituteNameOpp")) {
					const oOpportunity = this.soaState.getSelectedOpportunity();
					oOpportunity.instituteID = Number(oSelectedItem.getDescription());
					oOpportunity.institute.instituteName = oSelectedItem.getTitle();
					oOpportunity.institute_InstituteID = Number(oSelectedItem.getDescription());
					oOpportunity.institute_CountryCode = 'CL';
				}
				else if (this._sInputId.includes("InstituteName")) {
					const oTender = this.soaState.getNewTender();
					oTender.instituteID = Number(oSelectedItem.getDescription());
				}
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		onProductItemSelect: function(oEvent){
			const objContext = oEvent.getParameter("listItem").getBindingContext("soa");
			const selectedObj = objContext?.getObject();

			let oNextUIState = "";

			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("objectDetail", {
					layout: oNextUIState.layout,
					objectId: selectedObj?.opportunity_ID,
					productId: selectedObj?.iD
				});
			}.bind(this));
		},

		onSectionNavigate: function(oEvent){
			const selectedSection = oEvent.getParameter("section").getTitle();

			// Products Tab
			/*if(selectedSection && selectedSection.indexOf("Products") > -1){
				this.byId("editButtonId").setVisible(false);
			}*/
			
			// Opportunity Info Tab
			if(selectedSection && selectedSection.indexOf("Opportunity Info") > -1){
				this.byId("editButtonId").setVisible(true);

				let oNextUIState = "";
				this.oOwnerComponent.getHelper().then(function (oHelper) {
					oNextUIState = oHelper.getNextUIState(1);
					this.oRouter.navTo("object", {
						layout: oNextUIState.layout,
						objectId: this.sObjectId
					});
				}.bind(this));
			}
		},

		onAddProduct: function(oEvent){
			this.soaState.addProduct();
		},

		onDeleteProduct: function (oEvent) {
            var that = this;
            var aSelectedProduct = oEvent.getParameter("listItem");
			var sPathSelectedProduct = aSelectedProduct.getBindingContextPath();

            MessageBox.warning("Are you sure you want to delete this product?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === "YES") {
                        that.soaState.deleteProduct(parseInt(sPathSelectedProduct.substring(sPathSelectedProduct.lastIndexOf('/') + 1)));

                    } else {
                        //do nothing and stay on page
                    }
                }
            });


        },

	});

});