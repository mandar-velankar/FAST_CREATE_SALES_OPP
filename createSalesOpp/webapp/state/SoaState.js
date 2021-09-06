sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/Opportunity",
	"../model/Tender",
	"../model/Institute",
	"../model/Product",
	"../model/Country",
	"../libs/momentjs/moment.min",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
], function (BaseState, Opportunity, Tender, Institute, Product, Country, MomentJS, JSONModel, BusyIndicator, MessageBox) {
	"use strict";

	var soaState = BaseState.extend("com.bayer.tender.createsalesopportunity.state.SoaState", {

		constructor: function (oService) {
			//data used for the view
			// this.data = ObservableSlim.create({
			this.data = {
				opportunities: [],
				selectedOpportunity: {},
				selectedProduct: {},
				editMode: false,
				creationMode: false,
				//pricing: new Pricing()
			};
			// , true, (changes) => {
			// 	this.updateModel();
			// });

			this.soaService = oService;
			BaseState.call(this);
		},

		getService: function () {
			return this.soaService;
		},

		setEditMode: function (sEditMode){
			try {
				sEditMode && ( this.backupOpportunity = this.getSelectedOpportunity().getAll() );
				this.setProperty("editMode", sEditMode);
			} catch {
				this.setProperty("editMode", sEditMode);
			}
		},

		getEditMode: function (){
			return this.getProperty("editMode");
		},

		setCreationMode: function(sCreationMode){
			this.setProperty("creationMode", sCreationMode);
		},

		getCreationMode: function(){
			return this.getProperty("creationMode");
		},

		restoreBackup:function(){
			this.backupOpportunity && this.setSelectedOpportunity(this.createOpportunity(this.backupOpportunity));
		},
		setTenderMatchingStatus:function(status){
			this.getSelectedOpportunity().setTenderMatchingStatus(status);
			this.updateModel();
		},


		createOpportunity: function(data){
			if(data){

				// add results as wrapper in case Items does not contain one. 
				// This is needed to correctly create a Opportunity object
				data.Products && !data.Products.results && (data.Products = {results: data.Products});

				return new Opportunity(data);
			}

			return "You must provide an object literal as a parameter to create an opportunity.";
		},

		createTender: async function (tender) {
			await this.getService().createTender(this.getNewTender());
			await this.getService().createCountrySpecificInformation(this.getNewTender(),this.getSelectedOpportunity());
		},

		getNewTenderNo: function(sCountry){
			return this.getService().getNewTenderNo(sCountry).then(newTenderId => {
				this.setNextTenderNo(newTenderId.data.NEXT_TENDER_NO);
				return newTenderId.data.NEXT_TENDER_NO;
			});
		},

		getNewTenderID: async function(sCountry){
			let sTenderNo = await this.getNewTenderNo(sCountry);

			//get year & country
			var sYear = moment().format('YY');

			//new tender ID is build by country
			return sCountry + "-" + sYear + "-" + sTenderNo;
		},

		getNextTenderNo: function(){
			return this.nextTenderNo;
		},

		getNewTender: function(){
			return this.getProperty("newTender") || {};
		},

		setNextTenderNo: function(sTenderNo){
			this.nextTenderNo = Number(sTenderNo);
		},

		setSelectedOpportunity: function(opportunity){
			this.setProperty("selectedOpportunity", opportunity);
		},

		setTemporaryTender: async function(sCountry){
			const tender = await this.createNewTenderObject(sCountry);
			this.setProperty("newTender", tender);
		},

		getSelectedOpportunity: function(){
			return this.getProperty("selectedOpportunity");
		},

		clearSelectedOpportunity: function(){
			this.setSelectedOpportunity({});
		},

		setSelectedProduct: function(product){
			this.setProperty("selectedProduct", product);
		},

		getSelectedProduct: function(){
			return this.getProperty("selectedProduct");
		},

		getProductFromSelectedOpportunityByProductId: function(productId){
			let oProducts = this.getSelectedOpportunity().getProducts();
			if(oProducts && oProducts.length > 0){
				return this.getSelectedOpportunity().getProducts().find(prod => prod.iD == productId);
			}
		},

		/**
		 * Saves a given opportunity in the backend.
		 * @returns {Promise} - Return a promise
		 */
		saveSelectedOpportunity: function(){
			return this.getService().saveOpportunity(this.getSelectedOpportunity());
		},

		/**
		 * Fetches opportunities from the backend. 
		 * @returns {promise} - a list of opportunities
		 */
		getOpportunities: async function(){
			const { data } = await this.getService().getOpportunities();
			const opportunities = data.results.map(item => new Opportunity(item));
			this.setProperty("opportunities", opportunities);
			return this.getProperty("opportunities");
		},

		//detailPage so we can access it everywhere
		getDetailPage: function () {
		    return this.detailPage;	
		},

        //keep detailPage so we can access it everywhere
        setDetailPage: function (oDetailPage){
            this.detailPage = oDetailPage;
		},
		
		getNewUUID: function() {
			return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
			);
		},

		/**
		 * get list of country for current user
		 */
		 getCountries: function (){
								
			this.setProperty("countries", []);
			const ctrPromise = this.getService().getCountries().then(countries => {
				countries = countries.data.results;
				if(countries.length > 0){
					return countries.map(country => {
						return new Country(country);
					});
				} else {
					throw 'User not allowed';
				}
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [countries] = values;
				this.setProperty("countries", [...countries]);
				return this.getProperty("countries");
			});		

		},

		/* everything related to countrybrands & products */
		getBrands: async function () {
			let sCountryCode = this.getSelectedOpportunity().countryCode;

			const aCountryBrands = await this.getService().getCountryBrands(sCountryCode);
			this.setProperty("countryBrands", aCountryBrands.data.results);
        },

		getBrandProducts: async function (){
			let sCountryCode = this.getSelectedOpportunity().countryCode;

			const aCountryBrandProducts = await this.getService().getCountryBrandProducts(sCountryCode);
			this.setProperty("countryBrandProducts", aCountryBrandProducts.data.results);
		},

		setProductCollection: function (products) {
			this.setProperty("productCollection", products);
			this.updateModel();
		},

		//sorting an array of objects
		sortByKeyAsc: function (array, key) {
			if (array) {
				return array.sort(function (a, b) {
					var x = a[key];
					var y = b[key];
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				});
			}

		},

		onParticipateOpportunity: async function(oSelectedObjectContext, oView){
			if(oSelectedObjectContext){
				var oSelectedOpportunity = oSelectedObjectContext.getObject();
				var sCountryCode = oSelectedObjectContext.getProperty("CountryCode");
				var sTenderId = oSelectedObjectContext.getProperty("TenderID");

				const opportunity = this.createStateObject(oSelectedOpportunity, oView);
				this.setSelectedOpportunity(opportunity);
			} else {
				var oSelectedOpportunity = this.getSelectedOpportunity();
				var sCountryCode = oSelectedOpportunity.countryCode;
				var sTenderId = oSelectedOpportunity.tenderID;
			}
			
			
			await this.loadCountryInstitutes(sCountryCode);
			if (oSelectedOpportunity.mainStatus === "Active" || (oSelectedObjectContext && oSelectedObjectContext.getProperty("MainStatus") === "Active")) {
				this.openTender(sTenderId);
				return true;
			}

			await this.setTemporaryTender(sCountryCode);
		},

		openTender:function(tenderId){
			window.open("/app/#/tender&/t/detail/CL/" + tenderId + "//__component0---tenderManagementDetailId--basicInformationId//TwoColumnsMidExpanded");
		},

		createStateObject: function (selectedObj, oView) {

			// expand Comprador and Items
			selectedObj["Institute"] = selectedObj.Institute && oView.getModel().getObject(`/${selectedObj.Institute.__ref}`);
			selectedObj["Products"]["results"] = selectedObj.Products && selectedObj.Products.__list.map(path => oView.getModel().getObject(`/${path}`));

			return this.createOpportunity(selectedObj);

		},

		getParticipationDialog: function (oView) {
			//create new dialog if not yet existing
			if (!this._oParticipationDialog) {

				//get dialog
				/*this._oParticipationDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "com.bayer.tender.createsalesopportunity.view.fragments.OpportunityInfo",
					controller: this
				}).then(function (oParticipationDialog) {
					oView.addDependent(that._oParticipationDialog);
					return oParticipationDialog;
				});*/
				this._oParticipationDialog = sap.ui.xmlfragment(oView.getId(), "com.bayer.tender.createsalesopportunity.view.fragments.OpportunityInfo", this);
				oView.addDependent(this._oParticipationDialog);
			}

			return this._oParticipationDialog;
		},

		onCancelParticipation: function () {
			this._oParticipationDialog.close();
		},

		onSaveParticipation: async function (oEvent) {

			const oTender = this.getNewTender();
			let oView = oEvent ? oEvent.oSource : undefined;

			if (this._validateNewTender(oTender)) {
				try {
					BusyIndicator.show(0);
					await this.createTender(oTender);
					BusyIndicator.hide()
					this._oParticipationDialog.close();

					let opp = this.getSelectedOpportunity();
					opp.mainStatus = "Active";
					this.setSelectedOpportunity(opp);
					this.getModel().refresh();

					/* refresh master list binding */
					let oParent = oView ? oView.getParent() : undefined;
						oParent = oParent ? oParent.getParent() : undefined;
					let oList = oParent ? oParent.byId('list') : undefined; //get list from master screen
					if(oList){
						oList.getBinding("items").refresh(true);
						oList.getModel().refresh(true);
					}

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
				!oTender.bidDueDate) {

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
						'- Offer due Date \n',
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

		createNewOpportunityObject: async function(sObjectId, sCountryCode){ 

            const data = {
                "ID" : sObjectId,
				"CountryCode": sCountryCode,
				"Classification": "Contract",
				"TenderReference": "",
				"TenderChannel": "Distributor",
				"InstituteID": "",
				"InstituteName": "",
				"InstituteType": "Private",
				"PublicationDate": "",
				"BidDueDate": "",
				"ExpectedAwardDate":null,
				"NextPublicationDate": null,
				"ContractLength": 0,
				"ExtensionPeriod": 0,
				"Institute": {
					"InstituteName": ""
				},
				"Institute_InstituteID": 0,
				"Institute_CountryCode": "",
				"Description": ""
            };

            const oOpportunity = this.createOpportunity(data);
			oOpportunity.setTenderMatchingStatus("Out");
			this.setSelectedOpportunity(oOpportunity);
            return oOpportunity;
		},

		createNewTenderObject: async function(sCountry){ 
			const sTenderId = await this.getNewTenderID(sCountry);
			const oSelectedOpportunity = this.getModel('soa').getProperty('/selectedOpportunity');
			let   oDefaultInstitute = this.data.CountryInstitutes.find(institute => institute.InstituteID === this.data.selectedOpportunity.institute.instituteID);
			if(!oDefaultInstitute){
				//straight from create
				oDefaultInstitute = this.data.CountryInstitutes.find(institute => institute.InstituteID === this.data.selectedOpportunity.instituteID);
			}

            const data = {
                //"ID" : this.create_UUID(),
				"TenderID": sTenderId,
				"TenderNo": this.getNextTenderNo(),
				"CountryCode": sCountry,
				"Active": 1,
				"Classification": "Contract",
				"TenderName": "",
				"InstituteID": oDefaultInstitute ? oDefaultInstitute.InstituteID : "",
				"InstituteName": oDefaultInstitute ? oDefaultInstitute.InstituteName : "",
				"TenderChannel": "Direct",
				"InstituteType": oSelectedOpportunity.instituteType,
				"PublicationDate": oSelectedOpportunity.publicationDate,
				"BidDueDate": oSelectedOpportunity.offerDueDate,
				"AwardDate": oSelectedOpportunity.expectedAwardDate ? oSelectedOpportunity.expectedAwardDate : null,
				"NextPublicationDye": oSelectedOpportunity.nextPublicationDate ? oSelectedOpportunity.nextPublicationDate : null,
				"TenderStatus": "Open",
				"GroupPurchasing": Number(0),
				"SALES_TYPE_ID": Number(0),
				"TENDER_TYPE_ID": Number(6),
				"PROCUREMENT_METHOD_ID": "Not Specified",
				"PROCUREMENT_REASON": "",
				"HighValue": false,
				"ContractLength": oSelectedOpportunity.contractDurationTime ? Number(oSelectedOpportunity.contractDurationTime) : Number(0),
				"ContractExtenseion": oSelectedOpportunity.TermExtension ? Number(oSelectedOpportunity.TermExtension) : Number(0),
				"CONTRACT_TYPE_ID": Number(0)
            };

            const oTender = new Tender(data);
            return oTender;
		}, 	

		createEmptyProduct: function(oOpportunity){
			return new Product({
				"iD": this.getNewUUID(),
                "brandID": "",
                "comment": "",
				"recommendedPrice": 0.0,
				"requestedQuantity": 0,
                "opportunity_ID": oOpportunity.iD,
				"editable": true
			}, true);
		},

		addExistingProduct: function(oOpportunity, oProduct){
			return new Product({
				"iD": this.getNewUUID(),
                "brandID": oProduct.BRAND_ID,
				"brandName": oProduct.BRAND_NAME,
				"productPackName": oProduct.PRODUCT_NAME,
				"productPackId": oProduct.PRODUCT_ID,
                "comment": "",
				"recommendedPrice": 0.0,
				"requestedQuantity": 0,
                "opportunity_ID": oOpportunity.iD,
				"editable": true
			}, true);
		},

		addProduct: function(oAddedProduct){
			let oOpportunity = this.getSelectedOpportunity();
			if(!oOpportunity.products || Object.entries(oOpportunity.products).length === 0){
				var oProduct = this.addExistingProduct(oOpportunity, oAddedProduct)
				oOpportunity.products = [oProduct];
			} else {
				oOpportunity.products.push(this.addExistingProduct(oOpportunity, oAddedProduct));
			}
			
			this.updateModel();
		},

		allProductsDisplayMode: function(){
			let oOpportunity = this.getSelectedOpportunity();
			if(oOpportunity.products){
				oOpportunity.products.map(product => product.editable = false);
			}
			this.updateModel();
		},

		deleteProduct:function(iIndex){
			this.data.selectedOpportunity.products.splice(iIndex, 1);
			this.updateModel();
		},

		loadCountryChannels: async function(sCountry){
			const aCountryChannels = await this.getService().loadCountryChannels(sCountry);
			this.setProperty("CountryChannels", aCountryChannels.data.results);
		},

		loadCountryClassifications: async function(sCountry){
			const aCountryClassifications = await this.getService().loadCountryClassifications(sCountry);
			this.setProperty("CountryClassifications", aCountryClassifications.data.results);
		},

		loadCountryTenderTypes: async function(sCountry){
			const aCountryTenderTypes = await this.getService().loadCountryTenderTypes(sCountry);
			this.setProperty("CountryTenderTypes", aCountryTenderTypes.data.results);
		},

		loadCountryInstitutes: async function(sCountry, sInstituteType){
			const aCountryInstitutes = await this.getService().loadCountryInstitutes(sCountry, sInstituteType);
			this.setProperty("CountryInstitutes", aCountryInstitutes.data.results);
		},

		/* UI helpers */
		showMessageCompositeView: function (sTitle, aMessages, sState) {

			var that = this;

			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}',
				subtitle: '{subtitle}',
			   counter: '{counter}',
			   markupDescription: '{markupDescription}'
					//link: oLink
			});

			//Message view (where multiple errors can be bundeled)
			var oMessageView = new sap.m.MessageView({
					showDetailsPageHeader: false,
					itemSelect: function () {
						oBackButton.setVisible(true);
					},
					items: {
						path: "/",
						template: oMessageTemplate
					}
				}),
				oBackButton = new sap.m.Button({
					icon: sap.ui.core.IconPool.getIconURI("nav-back"),
					visible: false,
					press: function () {
						oMessageView.navigateBack();
						this.setVisible(false);
					}
				});

	   // 	//add messages	
			var oMessageModel = new JSONModel();
			oMessageModel.setData(aMessages);
			oMessageView.setModel(oMessageModel);

	   // 	//show dialog
			var oDialogMessages = new sap.m.Dialog({
				resizable: true,
				content: oMessageView,
				state: sState,
				beginButton: new sap.m.Button({
					press: function () {
						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: sTitle
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});

			oDialogMessages.open();

	   },

	});

	return soaState;

});