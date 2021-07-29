sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.createsalesopportunity.model.Product", {

        constructor: function (data, editable) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            this.isDirty = false;
            this.editable = editable || false;
            this.deletable = true;

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
                "iD",
                "brandID",
                "brandName",
                "productPackName",
                "productPackId",
                "recommendedPrice",
                "requestedQuantity",
                "comment",
                "opportunity_ID"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return product;
});