sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "../model/Institute",
    "../model/Product"
], function (BaseObject, Institute, Product) {
    "use strict";

    const opportunity = BaseObject.extend("com.bayer.tender.createsalesopportunity.model.Opportunity", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            /* eslint-disable */
            if (data) {

                data.Institute && !data.Institute.__deferred && this.setInstitute(data.Institute);
                data.Products && !data.Products.__deferred && this.setProducts(data.Products.results);

            }

            this["Products"] && delete this["Products"];
            /* eslint-enable */
        },

        setInstitute: function (institute) {
            if (institute) {
                this.institute = new Institute(institute);
            }
        },

        getInstitute: function () {
            return this.institute;
        },

        getInstituteId: function(){
            return this.institute_InstituteID;
        },

        getInstituteName: function(){
            if(this.institute){
               return this.institute.instituteName;
            }
        },

        getClosingDate: function(){
            return this.offerDueDate;
        },

        getTenderReference:function(){
            return this.iD; //using the ID as a reference to our sales opportunity in the tender application
        },

        getCountryCode:function(){
            return this.countryCode; //using the ID as a reference to our sales opportunity in the tender application
        },

        setProducts: function (products) {
            if (products) {
                this.products = products.map(prd => new Product(prd));
            }
        },

        getProducts: function () {
            return this.products || [];
        },

        getProductByProductPackId: function (productPackId) {
            return this.getProducts().find(product => product.productPackId === productPackId);
        },

        setTenderMatchingStatus: function (status) {
            if (status) this.tenderMatchingStatus = status;
        },

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },


        getJSON: function () {
            return this.getJSONObject([
                "iD",
                "countryCode",
                "tenderReference",
                "classification",
                "tenderChannel",
                "publicationDate",
                "offerDueDate",
                "nextPublicationDate",
                "expectedAwardDate",
                "contractLength",
                "extensionPeriod",
                "tenderMatchingStatus",
                "institute_InstituteID",
                "institute_CountryCode",
                "description",
                "currency"
            ]);
        },

        getJSONCountrySpecificTenderInfo: function () {
            /*var institute = this.getInstitute();
            if(institute){
                let organismCode = institute.getOrganismCode();
            }*/
            return {
                Institute: this.getInstituteName(),
                TenderReference: this.getTenderReference(),
                CountryCode:this.getCountryCode(),
                ClosingDate: this.getClosingDate(),
                ...this.getJSONObject(["publicationDate"])
            };
        },

        getAll: function () {
            return {
                ...this.getJSON(),
                //Institute: this.getInstitute() && this.getInstitute().getJSON(),
                Products: this.getProducts().map(item => item.getJSON())
            };
        }

    });

    return opportunity;
});