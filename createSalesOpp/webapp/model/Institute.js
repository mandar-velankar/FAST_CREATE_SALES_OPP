sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var institute = BaseObject.extend("com.bayer.tender.createsalesopportunity.model.Institute", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },
        getOrganismCode(){
            return this.organismCode;
        },
        /*
        distributorIDChanged:function(state,event){
            console.log("onChagned ditributor id");
        },
        */

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "countryCode",
                "instituteID",
                "customerID",
                "instituteName",
                "instituteType",
                "address",
                "contactNo",
                "fax",
                "contactPerson",
                "activeRecord",
                "comment",
                "city",
                "iNSTITUTE_HIERARCHY_ID",
                "state"
            ]);

        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return institute;
});