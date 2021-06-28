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

			return this.odata("/SalesOpportunities").get(mParameters);
		},

		saveOpportunity: function (opportunity) {

			const data = opportunity.getAll();

			const sKey = this.model.createKey("/SalesOpportunities", {
				ID: data.iD
			});

			return this.odata(sKey).put(data);

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

			aFilters.push(new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry),
				new sap.ui.model.Filter("InstituteType", sap.ui.model.FilterOperator.EQ, sInstituteType)
			);

			var mParameters = {
				filters: aFilters
			};

			return this.odata(sInstitutesPath).get(mParameters);
		},


	});

	return SoaService;
});