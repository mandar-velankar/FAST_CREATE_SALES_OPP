sap.ui.define([
	"sap/ui/base/Object"
], function (Object) {
	"use strict";
	
	var oUserInfo = Object.extend("com.bayer.tender.salesopportunity.model.UserInfo", {

		//GENERAL
		//-------
		
			//Local Variable
			//--------------
			
			_sToolID: "",
			_sCWID: "", 	//external active directory user ID,
			_email: "",
			_aUserCountries: [],
		
		//CONSTRUCTOR
		//-----------
				constructor: function () {
					
					//UserModel
					this._oUserModel = new sap.ui.model.json.JSONModel("/services/userapi/currentUser");
					
				},
		
		//GETTERS
		//-------
				//get model user info
				getUserModel: function (){
					return this._oUserModel;
				},			
				
				//get only the loged on user
				getUserName: function (){
					return this._oUserModel.getProperty("/name") || this.userName;
				},

				getUserEmail: function(){
					return this._email;
				},
				
				//get tool ID of user
				getToolID: function (){
					return this._sToolID;
				},

				//get tool ID of user
				getCWID: function (){
					return this._sCWID;
				},
				
				//get countries to wich the user has access
				getUserCountries: function(){
					return this._aUserCountries;
				},
				
		//SETTERS
		//-------
				setUserName: function(userName){
					this.userName = userName;	
				},

				setUserEmail: function(email){
					this._email = email;
				},
				
				//toolID of user
				setToolID: function (sToolID){
					this._sToolID = sToolID;
				},

				//CWID of user
				setCWID: function (sCWID){
					this._sCWID = sCWID;
				},
				
				//get countries to wich the user has access
				setUserCountries: function(aUserCountries){
					this._aUserCountries = aUserCountries;
				},
				
				
		//LOADERS
		//-------
		

		//CHECKERS
		//--------
				
		//SAVERS
		//------		
			
			
	});
	return new oUserInfo();
});