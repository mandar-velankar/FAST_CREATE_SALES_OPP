sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/Opportunity",
	"../libs/momentjs/moment.min",
	"sap/ui/model/json/JSONModel",
], function (BaseState, Opportunity, MomentJS, JSONModel) {
	"use strict";

	var soaState = BaseState.extend("com.bayer.tender.createsalesopportunity.state.SoaState", {

		constructor: function (oService) {
			//data used for the view
			// this.data = ObservableSlim.create({
			this.data = {
				opportunities: [],
				selectedOpportunity: {},
				selectedProduct: {},
				editMode: false
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
			//sEditMode && ( this.backupOpportunity = this.getSelectedOpportunity().getAll() );
			this.setProperty("editMode", sEditMode);
		},

		getEditMode: function (){
			return this.getProperty("editMode");
		},

		restoreBackup:function(){
			this.backupOpportunity && this.setSelectedOpportunity(this.createOpportunity(this.backupOpportunity));
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

		setSelectedOpportunity: function(opportunity){
			this.setProperty("selectedOpportunity", opportunity);
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
			return this.getSelectedOpportunity().getProducts().find(prod => prod.iD == productId);
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

		createNewOpportunityObject: async function(sObjectId){ 

            const data = {
                "ID" : sObjectId,
				"Classification": "Contract",
				"TenderReference": "",
				"TenderChannel": "Distributor",
				"InstituteID": "",
				"InstituteName": "",
				"InstituteType": "Direct",
				"PublicationDate": "",
				"BidDueDate": "",
				"NextPublicationDye": "",
				"ContractLength": 0,
				"ExtensionPeriod": 0,
            };

            const oOpportunity = this.createOpportunity(data);
			this.setSelectedOpportunity(oOpportunity);
            return oOpportunity;
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