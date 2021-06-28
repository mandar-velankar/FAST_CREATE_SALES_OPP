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


	});

	return SoaService;
});