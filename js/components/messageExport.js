"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("messageExport");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		return "<iframe style='width:100%;' id='iframe-"+elementIdOfComponentInstanceWrapper+"'></iframe>";
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		retStateObj.allMessageHtml = "<h2>The Human Intelligence Protocol Interface</h2><hr/>";

		var messageNumber = 0;

		addToAllMessagesRecursive("");

		function addToAllMessagesRecursive(recurseDialogPositionChain){

			// Don't try extracting a message on the Domain Root.
			if(recurseDialogPositionChain){

				var dialogSubArrRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, recurseDialogPositionChain);

				// Skip over links.  Only render the "trusting" dialog messages. 
				if(dialogSubArrRef.message && !HIPI.lib.Dialogs.isDialogLevelSkeptical(recurseDialogPositionChain)){

					messageNumber++;

					retStateObj.allMessageHtml += "<br/><hr/><strong>Message: "+messageNumber+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Dialog ID: "+recurseDialogPositionChain+"</strong><hr/><br/>";
					retStateObj.allMessageHtml += "<div style='white-space: pre-wrap; font-family: monospace;'>"+HIPI.framework.Utilities.escapeHtml(dialogSubArrRef.message)+"</div>";

					var parentDialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(recurseDialogPositionChain);

					if(parentDialogPositionChain){

						retStateObj.allMessageHtml += "<br/><hr/><strong>In Response To Message: "+parentDialogPositionChain+"</strong><br/><br/>";

						var parentDialogSubArrRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, parentDialogPositionChain);

						retStateObj.allMessageHtml += "<div style='white-space: pre-wrap; font-family: monospace; font-style: italic;'>"+HIPI.framework.Utilities.escapeHtml(parentDialogSubArrRef.message)+"</div>";
					}
				}
			}

			var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, recurseDialogPositionChain, true, false);
		
			childDialogPositionChainsArr.forEach(function(loopDialogPositionChain){
				addToAllMessagesRecursive(loopDialogPositionChain);
			});
		}

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var iframeElem = document.getElementById("iframe-" + elementIdOfComponentInstanceWrapper);

		iframeElem.contentDocument.write("<html><head><title></title></head><body>"+stateSlicesObj.allMessageHtml+"</body></html>");
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
