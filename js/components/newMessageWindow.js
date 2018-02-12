"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newMessageWindow");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!componentPropertiesObj.dialogPositionChain){

			var perpendicularOrientationClassName = "trusting-dialog";

			var dialogTitleStr = "Add Base Message";
		}
		else if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain)){

			var perpendicularOrientationClassName = "trusting-dialog";

			var dialogTitleStr = "Add Supportive Message / Answer";
		}
		else{

			var perpendicularOrientationClassName = "skeptical-dialog";

			var dialogTitleStr = "Add Skeptical Message / Question";
		}

		var retHtml = "<div class='new-message-dialog "+perpendicularOrientationClassName+"'>" +
						"<h2>"+dialogTitleStr+"</h2>" +
						"<newMessageTabs domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></newMessageTabs>" +
						"</div>";

		return retHtml;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
