/*
* SlickSelect v2.2.0 Copyright (c) 2018 AJ Savino
* https://github.com/koga73/SlickSelect
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var SlickSelect = {
	EVENT_CHANGE:"change",
	EVENT_OPEN:"open",
	EVENT_CLOSE:"close",
	
	CLASS_SLICKSELECT:"slickselect",
	CLASS_DISPLAY_SELECTED:"slickselect-display-selected",
	CLASS_OPTIONS:"slickselect-options",
	CLASS_OPTION:"slickselect-option",
	CLASS_OPTION_SELECTED:"slickselect-option-selected",
	CLASS_OPTION_HIGHLIGHT:"slickselect-option-highlight",
	CLASS_OPEN:"slickselect-open",
	CLASS_HIDDEN:"slickselect-hidden",
	
	defaultParams:{
		placeholder:null,	//Placeholder text
		scroll:false,		//Enable touch scrolling
		scrollSnapDist:8,	//Distance to snap to option
		clickDist:8,		//Distance to trigger click rather than scroll
		hover:false			//Open on hover
	}
};
(function($){ //Dependencies: jQuery
	$.fn.SlickSelect = function(params){
		var _params = $.extend({}, $.fn.SlickSelect.defaultParams, params);
		var _$select = this;
		
		var _vars = {
			_slickSelect:null,
			_displaySelected:null,
			_options:null,
			
			_keyIndex:-1,
			_isDragging:false,
			_beginDragPoint:null,
			_beginDragOptionsPoint:null,
			
			isOpen:false,
			selectedIndex:-1,
			value:null
		};
		
		var _methods = {
			initialize:function(initialSelection){
				//Copy classes
				var selectClasses = _$select[0].getAttribute("class");
				selectClasses = (selectClasses) ? selectClasses + " " : "";
				selectClasses += SlickSelect.CLASS_SLICKSELECT;
				
				//Create SlickSelect
				var slickSelect = document.createElement("div");
				slickSelect.setAttribute("tabindex", 0);
				slickSelect.setAttribute("class", selectClasses);
				_vars._slickSelect = slickSelect;
				
				var displaySelected = document.createElement("span");
				displaySelected.setAttribute("class", SlickSelect.CLASS_DISPLAY_SELECTED);
				_vars._displaySelected = displaySelected;
				
				var options = document.createElement("ul");
				options.setAttribute("class", SlickSelect.CLASS_OPTIONS);
				_vars._options = options;
				
				//Parse select options and create SlickSelect options
				var selectOptions = _$select[0].querySelectorAll("option");
				var selectOptionsLen = selectOptions.length;
				for (var i = 0; i < selectOptionsLen; i++){
					var selectOption = selectOptions[i];
					
					var slickSelectOption = document.createElement("li");
					slickSelectOption.setAttribute("class", SlickSelect.CLASS_OPTION);
					slickSelectOption.innerHTML = selectOption.innerHTML;
					
					//Copy attributes
					var selectAttributes = selectOption.attributes;
					var selectAttributesLen = selectAttributes.length;
					for (var j = 0; j < selectAttributesLen; j++){
                        var attrib = selectAttributes[j];
                        if (attrib.specified){
							if (attrib.name == "value"){
								slickSelectOption.setAttribute("data-value", selectOption.getAttribute("value"));
							} else if (attrib.name != "class" && !/^(data\-)?ng\-/.test(attrib.name)){
								slickSelectOption.setAttribute(attrib.name, attrib.value);
							}
                        }
                    }
					options.appendChild(slickSelectOption);
				}
				slickSelect.appendChild(displaySelected);
				slickSelect.appendChild(options);
				
				_$select[0].parentNode.insertBefore(slickSelect, _$select[0]);
				_$select.addClass(SlickSelect.CLASS_HIDDEN);
				
				if (initialSelection){
					_methods.selectOption(initialSelection);
				} else {
					var selected = _$select[0].querySelectorAll("option[selected]");
					if (selected.length){
						_methods.selectOption(selected[0].getAttribute("value"));
					} else {
						_methods.selectOption(-1);
					}
				}
				
				var $slickSelect = $(slickSelect);
				var $doc = $(document);
				$doc.on("keydown", _methods._handler_keydown);
				$slickSelect.on("focusout", _methods._handler_focusout);
				$slickSelect.on("click", _methods._handler_click);
				if (_params.hover){
					$slickSelect.on("mouseenter", _methods._handler_mouseenter);
					$slickSelect.on("mouseleave", _methods._handler_mouseleave);
				}
				if (_params.scroll){
					$slickSelect.on("touchstart mousedown", _methods._handler_beginDrag);
				}
			},
			
			destroy:function(){
				_methods.close();
				_methods._handler_endDrag();
				
				var slickSelect = _vars._slickSelect;
				if (slickSelect){
					var $slickSelect = $(slickSelect);
					$slickSelect.off("focusout", _methods._handler_focusout);
					$slickSelect.off("click", _methods._handler_click);
					$slickSelect.off("mouseenter", _methods._handler_mouseenter);
					$slickSelect.off("mouseleave", _methods._handler_mouseleave);
					$slickSelect.off("touchstart mousedown", _methods._handler_beginDrag);
					
					var $doc = $(document);
					$doc.off("keydown", _methods._handler_keydown);
					$doc.off("touchmove mousemove", _methods._handler_moveDrag);
					$doc.off("touchend mouseup", _methods._handler_endDrag);
					
					if (slickSelect.parentNode){
						slickSelect.parentNode.removeChild(slickSelect);
					}
					_vars._displaySelected = null;
					_vars._options = null;
					_vars._slickSelect = null;
				}
				
				_vars._beginDragPoint = null;
				_vars._beginDragOptionsPoint = null;
				_vars.selectedIndex = -1;
				_vars.value = null;
				
				_$select.removeClass(SlickSelect.CLASS_HIDDEN);
			},
			
			open:function(){
				if (_vars.isOpen){
					return;
				}
				_vars.isOpen = true;
				
				$(_vars._slickSelect).addClass(SlickSelect.CLASS_OPEN);
				_$select.trigger(SlickSelect.EVENT_OPEN);
			},
			
			close:function(){
				if (!_vars.isOpen){
					return;
				}
				_vars.isOpen = false;
				
				var $slickSelect = $(_vars._slickSelect);
				
				var $slickSelectOptions = $("." + SlickSelect.CLASS_OPTION, $slickSelect);
				$slickSelectOptions.removeClass(SlickSelect.CLASS_OPTION_HIGHLIGHT);
				_vars._keyIndex = -1; //Reset
				
				$slickSelect.removeClass(SlickSelect.CLASS_OPEN);
				_$select.trigger(SlickSelect.EVENT_CLOSE);
			},
			
			//'option' parameter can be an index, value, or $element
			selectOption:function(option){
				var $slickSelectOptions = $("." + SlickSelect.CLASS_OPTION, $(_vars._slickSelect));
				$slickSelectOptions.removeClass(SlickSelect.CLASS_OPTION_SELECTED);
				
				var $option = null;
				if (!isNaN(option)){ //Number: Index
					if (option == -1){ //Placeholder
						var placeholder = _$select.attr("data-placeholder") || _params.placeholder;
						if (placeholder){
							_vars._displaySelected.innerHTML = placeholder;
							_vars.selectedIndex = -1;
							_vars.value = null;
							_$select[0].selectedIndex = _vars.selectedIndex;
							return;
						} else {
							option = 0;
						}
					}
					if (option != -1){
						$option = $slickSelectOptions.eq(option);
					}
				} else if (!option.jquery){ //String: value $
					$option = $slickSelectOptions.filter("[data-value='" + option + "']");
				} else {
					$option = option;
				}
				var selectedIndex = _vars.selectedIndex;
				if ($option.length){
					selectedIndex = $option.index();
				} else if (selectedIndex < 0 || selectedIndex > $slickSelectOptions.length - 1){
					selectedIndex = 0;
				}
				
				var $optionSelected = $slickSelectOptions.eq(selectedIndex);
				$optionSelected.addClass(SlickSelect.CLASS_OPTION_SELECTED);
				if (_params.scroll){
					_vars._options.style.top = (-$optionSelected.position().top - 1) + "px";
				}
				if (_vars.selectedIndex != selectedIndex){
					_vars._displaySelected.innerHTML = $optionSelected[0].innerHTML;
					_vars.selectedIndex = selectedIndex;
					_vars.value = $option.attr("data-value");
					_$select[0].selectedIndex = _vars.selectedIndex;
					_$select.trigger(SlickSelect.EVENT_CHANGE);
				}
				
				_methods.close();
			},
			
			update:function(){
				var value = _vars.value;
				_methods.destroy();
				_methods.initialize(value);
			},
			
			_handler_click:function(evt){
				evt.preventDefault();
				
				var isClick = !_params.scroll;
				if (!isClick){
					var touchPoint = _methods._getTouchPoint(evt);
					var dist = Math.abs(touchPoint[1] - _vars._beginDragPoint[1]);
					if (dist < _params.clickDist){
						isClick = true;
					}
				}
				if (isClick){
					var $target = $(evt.target);
					if ($target.hasClass(SlickSelect.CLASS_OPTION)){
						_methods.selectOption($target);
					} else {
						if (!_vars.isOpen){
							_methods.open();
						} else {
							_methods.close();
						}
					}
				}
				
				return false;
			},
			
			_handler_mouseenter:function(evt){
				if (!_vars.isOpen){
					_methods.open();
				}
			},
			
			_handler_mouseleave:function(evt){
				if (_vars.isOpen){
					_methods.close();
				}
			},
			
			_handler_keydown:function(evt){
				var $slickSelect = $(_vars._slickSelect);
				if (!$slickSelect.is(":focus")){
					return;
				}
				var $slickSelectOptions = $("." + SlickSelect.CLASS_OPTION, $slickSelect);
				var slickSelectOptionsLen = $slickSelectOptions.length;
				var updateHighlighted = false;
				var keyCode = evt.keyCode;
				switch (true){
					case (keyCode == 38): //Up
						_vars._keyIndex--;
						if (_vars._keyIndex < 0){
							_vars._keyIndex = slickSelectOptionsLen - 1;
						}
						updateHighlighted = true;
						if (!_vars.isOpen){
							_methods.open();
						}
						break;
					case (keyCode == 40): //Down
						_vars._keyIndex++;
						if (_vars._keyIndex > slickSelectOptionsLen - 1){
							_vars._keyIndex = 0;
						}
						updateHighlighted = true;
						if (!_vars.isOpen){
							_methods.open();
						}
						break;
					case (keyCode == 13): //Enter
					case (keyCode == 32): //Space
						if (!_vars.isOpen){
							_methods.open();
						} else {
							if (_vars._keyIndex != -1){
								_methods.selectOption(_vars._keyIndex);
							} else {
								_methods.close();
							}
						}
						break;
					case (keyCode >= 48 && keyCode <= 57): //0-9
					case (keyCode >= 65 && keyCode <= 90): //A-Z
					case (keyCode >= 97 && keyCode <= 122): //a-z
						var keyIndex = _vars._keyIndex;
						var $tempList = $slickSelectOptions.slice(_vars._keyIndex + 1, slickSelectOptionsLen);
						$tempList = $.merge($tempList, $slickSelectOptions.slice(0, _vars._keyIndex + 1)); //Concat lastHalf with firstHalf
						var tempListLen = $tempList.length;
						for (var i = 0; i < tempListLen; i++){
							var $slickSelectOption = $($tempList[i]);
							if ($slickSelectOption.text().substr(0, 1).toLowerCase() == String.fromCharCode(keyCode).toLowerCase()){
								_vars._keyIndex = (i + _vars._keyIndex + 1) % tempListLen;
								updateHighlighted = true;
								if (!_vars.isOpen){
									_methods.open();
								}
								break;
							}
						}
						break;
					default:
						return;
				}
				
				evt.preventDefault();
				if (updateHighlighted){
					$slickSelectOptions.removeClass(SlickSelect.CLASS_OPTION_HIGHLIGHT);
					var $optionHighlighted = $slickSelectOptions.eq(_vars._keyIndex);
					$optionHighlighted.addClass(SlickSelect.CLASS_OPTION_HIGHLIGHT);
					
					//Scrolling
					var $options = $(_vars._options);
					var scrollHeight = $options[0].scrollHeight;
					var height = $options.height();
					if (scrollHeight > height){
						var scrollTop = $options.scrollTop();
						var selectedTop = $optionHighlighted.position().top + scrollTop;
						var selectedHeight = $optionHighlighted.outerHeight();
						//Needs to scroll
						if (selectedTop + selectedHeight > scrollTop + height){
							$options.scrollTop(selectedTop - height + selectedHeight);
						} else if (selectedTop < scrollTop){
							$options.scrollTop(selectedTop);
						}
					}
				}
				return false;
			},
			
			_handler_focusout:function(evt){
				evt.preventDefault();
				if (_vars.isOpen){
					_methods.close();
				}
				return false;
			},
			
			_handler_beginDrag:function(evt){
				if (_vars._isDragging){
					return;
				}
				_vars._beginDragPoint = _methods._getTouchPoint(evt);
				
				//Bind events
				var $doc = $(document);
				if (_params.scroll){
					$doc.off("touchmove mousemove", _methods._handler_moveDrag);
					$doc.on("touchmove mousemove", _methods._handler_moveDrag);
					$doc.off("touchend mouseup", _methods._handler_endDrag);
					$doc.on("touchend mouseup", _methods._handler_endDrag);
				}
				
				var $options = $(_vars._options);
				if ($options.is(":visible")){
					_vars._isDragging = true;
					var optionsPosition = $options.position();
					_vars._beginDragOptionsPoint = [optionsPosition.left, optionsPosition.top];
				}
			},
			
			_handler_moveDrag:function(evt){
				evt.preventDefault();
				if (!_vars._isDragging){
					return;
				}
				var $slickSelect = $(_vars._slickSelect);
				var $options = $(_vars._options);
				
				var touchPoint = _methods._getTouchPoint(evt);
				var newTop = _vars._beginDragOptionsPoint[1] + (touchPoint[1] - _vars._beginDragPoint[1]);
				var minTop = $slickSelect.outerHeight() - $options.outerHeight() - 1;
				var maxTop = -1;
				newTop = Math.max(Math.min(newTop, maxTop), minTop);
				
				var slickSelectHalfHeight = $slickSelect.outerHeight() * 0.5;
				
				var $slickSelectOptions = $("." + SlickSelect.CLASS_OPTION, $slickSelect);
				var slickSelectOptionsLen = $slickSelectOptions.length;
				for (var i = 0; i < slickSelectOptionsLen; i++){
					var $option = $($slickSelectOptions[i]);
					var optionTop = $option.position().top;
					var optionMiddle = optionTop + $option.outerHeight() * 0.5;
					var dist = Math.abs(newTop + optionMiddle - slickSelectHalfHeight);
					if (dist <= slickSelectHalfHeight){
						$slickSelectOptions.removeClass(SlickSelect.CLASS_OPTION_SELECTED);
						$slickSelectOptions.eq(i).addClass(SlickSelect.CLASS_OPTION_SELECTED);
						if (dist < _params.scrollSnapDist){
							newTop = -optionTop + maxTop;
						}
					}
				}
				
				$options.css("top", newTop + "px");
			},
			
			_handler_endDrag:function(evt){
				if (!_vars._isDragging){
					return;
				}
				_vars._isDragging = false;
				
				//Unbind events
				var $doc = $(document);
				if (_params.scroll){
					$doc.off("touchmove mousemove", _methods._handler_moveDrag);
					$doc.off("touchend mouseup", _methods._handler_endDrag);
				}
				
				var $optionSelected = $("." + SlickSelect.CLASS_OPTION_SELECTED, $(_vars._slickSelect));
				if ($optionSelected.length){
					_methods.selectOption($optionSelected);
				}
			},
			
			_getTouchPoint:function(evt){
				var pointData = evt;
				if (evt.originalEvent){
					if (evt.originalEvent.touches || evt.originalEvent.changedTouches){
						pointData = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
					}
				}
				return [
					pointData.clientX,
					pointData.clientY
				];
			}
		};
		
		_$select.SlickSelect = { //Expose public methods
			isOpen:function(){return _vars.isOpen;}, //Getter
			selectedIndex:function(){return _vars.selectedIndex;}, //Getter
			value:function(){return _vars.value;}, //Getter
			
			initialize:_methods.initialize,
			destroy:_methods.destroy,
			open:_methods.open,
			close:_methods.close,
			selectOption:_methods.selectOption,
			update:_methods.update
		};
		_$select.SlickSelect.initialize();
		return _$select; //jQuery chaining
	}
	
	$.fn.SlickSelect.defaultParams = SlickSelect.defaultParams;
}(jQuery)); //$