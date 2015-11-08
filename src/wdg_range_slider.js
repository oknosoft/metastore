/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_range_slider
 */

/**
 * ### Визуальный компонент для установки пары min и max значений с полями ввода и ползунком
 * Унаследован от [noUiSlider](http://refreshless.com/nouislider/)
 *
 * @class ORangeSlider
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.on_change {Function} - событие, которое генерирует компонент при изменении значений
 * @param attr.name {String} - Имя свойства
 * @param attr.synonym {String} - Текст заголовка
 * @param attr.tooltip {String} - Текст всплывающей подсказки
 * @param attr.range {Object} - диапазон
 * @param attr.start {Object} - начальные значения
 * @constructor
 */
function ORangeSlider(attr) {

	var _div = document.createElement("div"),
		_title = document.createElement("div"),
		_slider = document.createElement("div"),
		_min,
		_max;

	attr.container.appendChild(_div);
	_div.appendChild(_title);
	_title.style.marginBottom = "12px";
	_title.innerHTML = attr.synonym + ": <input name='min' /> - <input name='max' />"
	_min = _title.querySelector('[name=min]');
	_max = _title.querySelector('[name=max]');
	_min.style.width = "33%";
	_max.style.width = "33%";

	_div.appendChild(_slider);

	function create(){

		noUiSlider.create(_slider, {
			start: [ attr.start ? attr.start.min : 100, attr.start ? attr.start.max : 10000 ], // Handle start position
			step: attr.step || 100, // Slider moves in increments of '10'
			margin: attr.margin || 100, // Handles must be more than '20' apart
			connect: true, // Display a colored bar between the handles
			behaviour: 'tap-drag', // Move handle on tap, bar is draggable
			range: { // Slider can select '0' to '100'
				'min': attr.range ? attr.range.min : 200,
				'max': attr.range ? attr.range.max : 10000
			}
		});

		// When the slider value changes, update the input and span
		_slider.noUiSlider.on('update', function( values, handle ) {
			if ( handle ) {
				_max.value = values[handle];
			} else {
				_min.value = values[handle];
			}
			on_change();
		});
	}

	function on_change(){
		var val = {};
		val[attr.name] = [parseInt(_min.value) || 0, parseInt(_max.value) || 100000];
		attr.on_change(val);
	}

	function input_bind(){
		_slider.noUiSlider.set([_min.value, _max.value]);
		on_change();
	}

	create();

	// When the input changes, set the slider value
	_min.addEventListener('change', input_bind);
	_max.addEventListener('change', input_bind);

	_slider.rebuild = function (nattr) {
		if(nattr.range)
			attr.range = nattr.range;
		if(nattr.start)
			attr.start = nattr.start;
		_slider.noUiSlider.destroy();
		create();
	};

	return _slider;

};
