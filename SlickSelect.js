/*
* SlickSelect v1.1.0 Copyright (c) 2014 AJ Savino
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
	
	TEMPLATE_SELECT:"<div class='slickselect' tabindex='0'><span class='slickselect-selected'></span><ul class='slickselect-options'></ul></div>",
	TEMPLATE_OPTION:"<li class='slickselect-option'></li>",
	
	CLASS_SLICKSELECT:"slickselect",
	CLASS_SELECTED:"slickselect-selected",
	CLASS_OPTIONS:"slickselect-options",
	CLASS_OPTION:"slickselect-option",
	CLASS_OPEN:"slickselect-open",
	CLASS_KEY_HIGHLIGHT:"slickselect-key-highlight",
	
	defaults:{
		placeholder:null
	}
};
(function($){ //Dependencies: jQuery
	$.fn.SlickSelect = function(options){
		var _options = $.extend({}, $.fn.SlickSelect.defaults, options);
		var _instance = this;
		
		var _vars = {
			_slickSelect:null,
			_keyIndex:-1,
			
			isOpen:false,
			selectedIndex:-1,
			value:null
		};
		
		var _methods = {
			init:function(){
				var slickSelect = $(SlickSelect.TEMPLATE_SELECT);
				slickSelect.attr("class", slickSelect.attr("class") + " " + _instance.attr("class")); //Copy classes
				
				var options = $("option", _instance);
				options.each(function(index){
					var option = $(SlickSelect.TEMPLATE_OPTION).append($(this).html());
					option.attr("data-value", $(this).attr("value"));
					$("." + SlickSelect.CLASS_OPTIONS, slickSelect).append(option);
				});
				slickSelect.insertBefore(_instance);
				_instance.hide();
				
				slickSelect.on("click", _methods._handler_click);
				$(document).on("keydown", _methods._handler_keydown);
				slickSelect.on("focusout", _methods._handler_focusout);
				_vars._slickSelect = slickSelect;
				
				var selected = options.filter("[selected]").val();
				if (selected){
					_methods.selectOption(selected);
				} else {
					_methods.selectOption(-1);
				}
			},
			
			open:function(){
				if (_vars.isOpen){
					return;
				}
				_vars.isOpen = true;
				_vars._slickSelect.addClass(SlickSelect.CLASS_OPEN);
				_instance.trigger(SlickSelect.EVENT_OPEN);
			},
			
			close:function(){
				if (!_vars.isOpen){
					return;
				}
				_vars.isOpen = false;
				
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				options.removeClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
				_vars._keyIndex = -1; //Reset
								
				_vars._slickSelect.removeClass(SlickSelect.CLASS_OPEN);
				_instance.trigger(SlickSelect.EVENT_CLOSE);
			},
			
			selectOption:function(option){
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				if (!isNaN(option)){ //Number: Index
					if (option == -1){ //Placeholder
						var placeholder = _instance.attr("data-placeholder") || _options.placeholder;
						if (placeholder){
							$("." + SlickSelect.CLASS_SELECTED, _vars._slickSelect).html(placeholder);
							_vars.selectedIndex = -1;
							_vars.value = null;
							_instance[0].selectedIndex = _vars.selectedIndex;
							return;
						} else {
							option = 0;
						}
					}
					if (option != -1){
						option = options.eq(option);
					}
				} else if (!option.jquery){ //String: value
					option = options.filter("[data-value='" + option + "']");
				}
				_vars.selectedIndex = option.index();
				_vars.value = option.attr("data-value");
				
				$("." + SlickSelect.CLASS_SELECTED, _vars._slickSelect).html(option.html());
				_instance[0].selectedIndex = _vars.selectedIndex;
				_instance.trigger(SlickSelect.EVENT_CHANGE);
				
				_methods.close();
			},
			
			_handler_click:function(evt){
				evt.preventDefault();
				var target = $(evt.target);
				if (target.hasClass("slickselect-option")){
					_methods.selectOption(target);
				} else {
					if (!_vars.isOpen){
						_methods.open();
					} else {
						_methods.close();
					}
				}
				return false;
			},
			
			_handler_keydown:function(evt){
				if (!_vars._slickSelect.is(":focus")){
					return;
				}
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				var updateSelected = false;
				var keyCode = evt.keyCode;
				switch (true){
					case (keyCode == 38): //Up
						_vars._keyIndex--;
						if (_vars._keyIndex < 0){
							_vars._keyIndex = options.length - 1;
						}
						updateSelected = true;
						if (!_vars.isOpen){
							_methods.open();
						}
						break;
					case (keyCode == 40): //Down
						_vars._keyIndex++;
						if (_vars._keyIndex > options.length - 1){
							_vars._keyIndex = 0;
						}
						updateSelected = true;
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
						var tempList = options.slice(_vars._keyIndex + 1, options.length);
						tempList = $.merge(tempList, options.slice(0, _vars._keyIndex + 1));
						var tempListLen = tempList.length;
						for (var i = 0; i < tempListLen; i++){
							var item = $(tempList[i]);
							if (item.text().substr(0, 1).toLowerCase() == String.fromCharCode(keyCode).toLowerCase()){
								_vars._keyIndex = (i + _vars._keyIndex + 1) % tempListLen;
								updateSelected = true;
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
				if (updateSelected){
					options.removeClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
					var selectedOption = options.eq(_vars._keyIndex);
					selectedOption.addClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
					
					//Scrolling
					var optionList = $("." + SlickSelect.CLASS_OPTIONS, _vars._slickSelect);
					var scrollHeight = optionList[0].scrollHeight;
					var height = optionList.height();
					if (scrollHeight > height){
						var scrollTop = optionList.scrollTop();
						var selectedTop = selectedOption.position().top + scrollTop;
						var selectedHeight = selectedOption.outerHeight();
						//Needs to scroll
						if (selectedTop + selectedHeight > scrollTop + height){
							optionList.scrollTop(selectedTop - height + selectedHeight);
						} else if (selectedTop < scrollTop){
							optionList.scrollTop(selectedTop);
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
			}
		};
		
		_instance.SlickSelect = { //Expose public methods
			isOpen:function(){return _vars.isOpen;}, //Getter
			selectedIndex:function(){return _vars.selectedIndex;}, //Getter
			value:function(){return _vars.value;}, //Getter
			
			init:_methods.init,
			open:_methods.open,
			close:_methods.close,
			selectOption:_methods.selectOption
		};
		_instance.SlickSelect.init();
		return _instance; //jQuery chaining
	}
	
	$.fn.SlickSelect.defaults = SlickSelect.defaults;
}(jQuery));