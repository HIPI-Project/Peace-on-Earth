"use strict";
postInit(function(){

	HIPI.framework.AppState.addStateCleanerFunction(function(stateObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);

		console.log("Running primary state cleaner on State Obj: ", stateObj);

		// Various attributes attached to the Dialogs and Contradictions arrays/objects might be used for performance or to control a temporary state and should not be persisted to disk.
		for(var i=0; i<stateObj.domains.length; i++)
			cleanDialogDataRecursive(stateObj.domains[i]);

		function cleanDialogDataRecursive(dialogRef){

			delete dialogRef.contradicted;
			delete dialogRef.showContradictWindow;
			delete dialogRef.showNewMessageDialog;
			delete dialogRef.showEditMessageDialog;
			delete dialogRef.newMessageSelectedTab;
			delete dialogRef.selected;
			delete dialogRef.showPerpendicularLevel;
			delete dialogRef.cachedSuggestedContradictions;
			delete dialogRef.depth;
			delete dialogRef.isAnswered;

			if(dialogRef.dialogs){

				if(!Array.isArray(dialogRef.dialogs))
					throw new Error("Error in global state cleaner, cleanDialogDataRecursive, the dialogs property is not of type array.");

				for(var i=0; i<dialogRef.dialogs.length; i++)
					cleanDialogDataRecursive(dialogRef.dialogs[i]);

				if(dialogRef.dialogs.length === 0)
					delete dialogRef.dialogs;
			}

			cleanContradictionDataRecursive(dialogRef);
		}

		function cleanContradictionDataRecursive(contradictionsRef){

			delete contradictionsRef.contradicted;
			delete contradictionsRef.showContradictWindow;
			delete contradictionsRef.cachedSuggestedContradictions;
			delete contradictionsRef.newContradictionSelectedTab;

			if(contradictionsRef.contradictions){

				if(!Array.isArray(contradictionsRef.contradictions))
					throw new Error("Error in global state cleaner, cleanContradictionDataRecursive, the contradictions property is not of type array.");

				for(var i=0; i<contradictionsRef.contradictions.length; i++)
					cleanContradictionDataRecursive(contradictionsRef.contradictions[i]);

				if(contradictionsRef.contradictions.length === 0)
					delete contradictionsRef.contradictions;
			}
		}

		return stateObj;
	});
});
