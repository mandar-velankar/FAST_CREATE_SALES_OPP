sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"../model/UserInfo",
], function (CoreService, Sorter, Filter, FilterOperator, UserInfo) {
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

		//load User information from back-end and keep information in userinfo
		/*loadUserInfo: function () {

			var that = this;

			//get user name of logedin user
			this.getCurrentUser().then(user => {
				UserInfo.setUserName(user.name);
			}).catch(fail=>{
				console.log("Not running on CF using CAP")
			}).then(()=>{
				var sUserName = UserInfo.getUserName();
				//build path for getting the user external ID + next tender number
				var sPathUserInfo = "/Users('" + encodeURIComponent(sUserName) + "')"; //"/UserInfo('" + UAT + "')"

				//read the UserInfo view from the back-end
				oFastDataCalls.read(sPathUserInfo, {
					urlParameters: {
						"$expand": "toUserCountries"
					},
					success: function (oData, oResponse) {

						//keep tool ID
						UserInfo.setToolID(oData.TOOL_ID);

						//keep the external Active directory id
						UserInfo.setCWID(oData.CWID);

						//set the user email
						UserInfo.setUserEmail(oData.UserEmail);

						//keep the countries to which the user has access
						oData.toUserCountries.results = that.sortByKeyAsc(oData.toUserCountries.results, "COUNTRY_NAME");
						UserInfo.setUserCountries(oData.toUserCountries);

						//let the callback be triggered: all data is loaded
						oDeferred.resolve();

					},
					error: function fnError(oError) {

						//Message
						var sMessage = "User ID (" + UserInfo.getUserName() + ") doesn't have access";

						//show error message
						that.showNoAccessMessage(oError, sMessage);

						oDeferred.reject(oError);

					}
				});
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},*/

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