sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var SoaService = CoreService.extend("com.bayer.tender.createsalesopportunity.service.SoaService", {

		constructor: function (model) {
			CoreService.call(this, model);
		},

		/**
		 * Fetches sales opportunities from the backend.
		 * @param {string} sPublicationDate - 
		 * @returns {promise} - a list of opportunities
		 */
		getOpportunities: function () {

			var aFilters = [];

			// if (sPublicationDate) {

			// 	var oPublicationDateFilter = new Filter({
			// 		path: 'PublicationDate',
			// 		operator: FilterOperator.EQ,
			// 		value1: sPublicationDate
			// 	});

			// 	aFilters.push(oPublicationDateFilter);
			// }


			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "Institute,Products"
				}
			};

			return this.odata("/PublicSalesOpportunities").get(mParameters);
		},

		/**
		 * Get a list of countries for current user
		 */
		 getCountries: function () {
			
			let sPath = "/TenderCountriesUser";

			var mParameters = {
			};

			return this.odata(sPath).get(mParameters);
		},

		saveOpportunity: function (opportunity) {

			const data = opportunity.getAll();

			const sKey = this.model.createKey("/SalesOpportunities", {
				ID: data.ID
			});

			return this.odata(sKey).put(data);

		},

		/* get a new Tender ID */
		getNewTenderNo: function (sCountry) {
			const sKey = this.model.createKey("/CountryTenderNo", {
				COUNTRY_CODE: sCountry
			});

			return this.odata(sKey).get();
		},

		getCountryBrands: function (sCountryCode) {
            let sPath = "/CountryBrands";

            var aFilters = [];

			if (sCountryCode) {

				var oCountryCodeFilter = new Filter({
					path: 'COUNTRY_CODE',
					operator: FilterOperator.EQ,
					value1: sCountryCode
				});

				aFilters.push(oCountryCodeFilter);
			}

            
			var mParameters = {
				filters: aFilters
				
			};
            

			return this.odata(sPath).get(mParameters);
        },

		/*getCountryBrandProducts: function (sCountryCode, sBrandId) {
            let sPath = "/CountryBrandProducts";

            var aFilters = [];

			if (sCountryCode) {
				aFilters.push(new Filter({
					path: 'COUNTRY_CODE',
					operator: FilterOperator.EQ,
					value1: sCountryCode}));
			}

			if (sBrandId){
				aFilters.push(new Filter({
					path: 'BRAND_ID',
					operator: FilterOperator.EQ,
					value1: sBrandId}));
			}

            
			var mParameters = {
				filters: aFilters
			};
            

			return this.odata(sPath).get(mParameters);
        },*/

		getCountryBrandProducts: function (sCountryCode) {
            let sPath = "/CountryBrandProducts";

            var aFilters = [];

			if (sCountryCode) {
				aFilters.push(new Filter({
					path: 'COUNTRY_CODE',
					operator: FilterOperator.EQ,
					value1: sCountryCode}));
			}
            
			var mParameters = {
				filters: aFilters
			};
            

			return this.odata(sPath).get(mParameters);
        },

		loadCountryChannels: function (sCountry) {
			const sCountryChannelsPath = "/CountryChannels";
			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("ChannelCountry", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			aFilters.push(new sap.ui.model.Filter("ChannelName", sap.ui.model.FilterOperator.NE, 'OTC')); //exclude OTC

			var mParameters = {
				filters: aFilters
			};

			return this.odata(sCountryChannelsPath).get(mParameters);
		},

		loadCountryClassifications: function (sCountry) {
			const sCountryClassificationsPath = "/CountryClassifications";
			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			var mParameters = {
				filters: aFilters
			};

			return this.odata(sCountryClassificationsPath).get(mParameters);
		},

		loadCountryTenderTypes: function (sCountry) {
			const sCountryTenderTypesPath = "/CountryTenderType";
			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "TenderType"
				},
			};

			return this.odata(sCountryTenderTypesPath).get(mParameters);
		},

		loadCountryInstitutes: function (sCountry, sInstituteType) {
			const sInstitutesPath = "/PT_TMINST";
			var aFilters = [];

			aFilters.push(new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry));

			if(sInstituteType){
				aFilters.push(new sap.ui.model.Filter("InstituteType", sap.ui.model.FilterOperator.EQ, sInstituteType));
			}

			var mParameters = {
				filters: aFilters
			};

			return this.odata(sInstitutesPath).get(mParameters);
		},

		/* create & update */
		createTender: function (oTender) {

			const data = oTender.getJSON();
			return this.odata("/PT_TMTEND").post(data);

		},

		createCountrySpecificInformation: function (tender, opportunity) {
			const data = {
				...tender.getJSONTenderID(),
				...opportunity.getJSONCountrySpecificTenderInfo(),

			};
			return this.odata("/CountrySpecificInformation").post(data);
		}

	});

	return SoaService;
});