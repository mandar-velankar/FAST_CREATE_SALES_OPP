sap.ui.define(["sap/ui/core/MessageType", "sap/ui/core/IndicationColor"], function (MessageType, IndicationColor) {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        statusToColor: function (status, substatus) {
            let color = MessageType.None;
            if (status && status === "Participated") {
                switch (substatus) {
                    case "Draft": 
                        color = IndicationColor.Indication08;//"Grey"==> Purple;
                        break;
                    case "Appeal in Progress":
                        color = MessageType.Warning;//"Yellow";
                        break;
                    case "Won":
                        color = MessageType.Success;//"Green";
                        break;
                    case "Lost":
                        color = MessageType.Error;//"Red";
                        break;
                    case "Submitted":
                        color = MessageType.Information;//"blue";
                        break;
                    default:
                        color = MessageType.None;
                        break;
                }
            }
            return color;
        }
    };
});