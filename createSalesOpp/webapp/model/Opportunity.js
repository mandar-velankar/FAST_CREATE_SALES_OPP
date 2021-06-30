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

        setProducts: function (products) {
            if (products) {
                this.products = products.map(prd => new Product(prd));
            }
        },

        getProducts: function () {
            return this.products || [];
        },

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },


        getJSON: function () {
            return this.getJSONObject([
                "iD",
                "tenderReference",
                "classification",
                "tenderChannel",
                "publicationDate",
                "offerDueDate",
                "nextPublicationDate",
                "contractLength",
                "extensionPeriod"
            ]);
        },

        getAll: function () {
            return {
                ...this.getJSON(),
                Institute: this.getInstitute() && this.getInstitute().getJSON(),
                Products: this.getProducts().map(item => item.getJSON())
            };
        }

    });

    return opportunity;
});