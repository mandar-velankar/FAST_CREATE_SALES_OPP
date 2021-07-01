sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
], function (BaseObject) {
    "use strict";

    var tender = BaseObject.extend("com.bayer.tender.salesopportunity.model.Tender", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },
        getJSONTenderID:function(){
            return this.getJSONObject(["tenderID"]);
        },
        getJSON: function () {

            const json = this.getJSONObject([
                //"iD",
                "tenderID",
                "countryCode",
                "tenderNo",
                "highValue",
                "active",
                "classification",
                "tenderName",
                "instituteID",
                "tenderChannel",
                "groupPurchasing",
                "publicationDate",
                "bidDueDate",
                "awardDate",
                "nextPublicationDye",
                "contractLength",
                "contractExtenseion",
                "contractLength",
                "tenderStatus",
                "tENDER_TYPE_ID",
                "cONTRACT_TYPE_ID",
                "sALES_TYPE_ID",
                "tENDER_ORIGIN_ID",
                "pROCUREMENT_METHOD_ID",
                "pROCUREMENT_REASON",
            ]);

            return {
                ...json,
                TenderNo: +json.TenderNo,
                InstituteID: +json.InstituteID,
                Active: +json.Active,
                GroupPurchasing: +json.GroupPurchasing,
                ContractLength: +json.ContractLength,
                //ContractExtenseion: +json.ContractExtenseion,
                TENDER_TYPE_ID: +json.TENDER_TYPE_ID,
                CONTRACT_TYPE_ID: +json.CONTRACT_TYPE_ID,
                SALES_TYPE_ID: +json.SALES_TYPE_ID,
                TENDER_ORIGIN_ID: +json.TENDER_TYPE_ID
            }
        },

    });

    return tender;
});