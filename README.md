## SlickSelect

SlickSelect - A jQuery plugin that extends select dropdown styles and functionality. Uses standard select markup. Works down to IE8. Keyboard accessible. Supports touch events for "scrolling" lists (see demo).

### Implementation
Include JS and CSS files on your page in addition to jQuery

HTML
```html
<!-- This markup gets hidden and replaced by SlickSelect markup -->
<!-- When the SlickSelect selection changes the original select is updated -->
<!-- data-placeholder attribute is optional -->
<select data-placeholder="Placeholder">
	<option value="test1">Test 1</option>
	<option value="test2">Test 2</option>
	<option value="test3">Test 3</option>
	<option value="test4">Test 4</option>
	<option value="test5">Test 5</option>
</select>
```

JS
```html
$("#sltTest").SlickSelect();

$("#sltTest").on("change", function(){
	console.log("CHANGE: ", $(this)[0].selectedIndex, $(this).val());
});
```

----------

#### JavaScript API
```javascript
/* Events */
SlickSelect.EVENT_CHANGE
SlickSelect.EVENT_OPEN
SlickSelect.EVENT_CLOSE


/* Methods */

//Parameters are optional
var ss = $("#sltTest").SlickSelect({
	placeholder:null,	//Placeholder text
	scroll:false,		//Enable touch scrolling
	scrollSnapDist:8,	//Distance to snap to option
	clickDist:8			//Distance to trigger click rather than scroll
});

//Called automatically
//The 'initialSelection' parameter is optional but allows will automatically call selectOption for you
//See selectOption for parameter details
ss.SlickSelect.initialize(initialSelection);

//Destroys the SlickSelect instance and will need to be reinitialized
ss.SlickSelect.destroy();

//Opens the SlickSelect dropdown
ss.SlickSelect.open();

//Closes the SlickSelect dropdown
ss.SlickSelect.close();

//Selects an option
//The 'option' parameter can be an index, value, or $element
//Passing -1 will select the placeholder if present
ss.SlickSelect.selectOption(option);

//Updates the list of options from the original select
//Calls destroy then initialize while attempting to preserve the selected option
ss.SlickSelect.update();

//Returns true if the dropdown is open
ss.SlickSelect.isOpen();

//Returns the selected index
//Returns -1 if the placeholder is selected
ss.SlickSelect.selectedIndex();

//Returns the selected value
ss.SlickSelect.value();
```

----------

#### Events
```javascript
//Note: Events are fired from the original select element
$("#sltTest").on("change", function(){
	console.log("CHANGE: ", $(this)[0].selectedIndex, $(this).val());
});
```