/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_filter_prop
 */

/**
 * ### Визуальный компонент для установки отборов по реквизитам (в том числе - вычисляемым), свойствам и категориям элементов справочника
 * - Отображает коллекцию элементов отбора и элементы управления с доступными значениями
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически обновляет состав доступных свойств при изменении отбора по родителю, выполняя запрос к irest-сервису библиотеки интеграции 1С
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachPropFilter` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OPropFilter
 * @param mgr {DataManager}
 * @param attr {Object} - параметры создаваемого компонента
 * @param [callback] {Function} - если указано, будет вызвана после инициализации компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachPropFilter = function(mgr, attr) {

	if(!attr)
		attr = {};
	var _cell = this,
		_cont = document.createElement("div"),
		_form = document.createElement("div"),
		_add = document.createElement("div"),
		_price = document.createElement("div"),
		_price_title = document.createElement("div"),
		_price_slider = document.createElement("div"),
		_price_min,
		_price_max,
		_parent,
		pf = new function OPropFilter(){
			this.children = [];
		};

	// подключим дополнительные элементы
	_cell.attachObject(_cont);
	_cell.cell.firstChild.style.overflow = "auto";

	// слайдер цены
	_cont.appendChild(_price);
	_price.appendChild(_price_title);
	_price.style.marginBottom = "8px";
	_price_title.style.marginBottom = "8px";
	_price_title.innerHTML = "Цена: <input name='min' /> - <input name='max' />"
	_price_min = _price_title.querySelector('[name=min]');
	_price_max = _price_title.querySelector('[name=max]');
	_price_min.style.width = "33%";
	_price_max.style.width = "33%";

	_price.appendChild(_price_slider);
	noUiSlider.create(_price_slider, {
		start: [ 600, 6000 ], // Handle start position
		step: 100, // Slider moves in increments of '10'
		margin: 100, // Handles must be more than '20' apart
		connect: true, // Display a colored bar between the handles
		behaviour: 'tap-drag', // Move handle on tap, bar is draggable
		range: { // Slider can select '0' to '100'
			'min': 200,
			'max': 10000
		}
	});

	// When the slider value changes, update the input and span
	_price_slider.noUiSlider.on('update', function( values, handle ) {
		if ( handle ) {
			_price_max.value = values[handle];
		} else {
			_price_min.value = values[handle];
		}
	});
	function input_bind(){
		_price_slider.noUiSlider.set([_price_min.value, _price_max.value]);
	}

	// When the input changes, set the slider value
	_price_min.addEventListener('change', input_bind);
	_price_max.addEventListener('change', input_bind);

	// форма
	_form.style.width = "100%";
	_form.style.height = "100px";
	_cont.appendChild(_form);

	_add.style.width = "100%";
	_add.style.height = "100%";
	_cont.appendChild(_add);


	pf.form = new dhtmlXForm(_form, [
		{ type:"settings" , labelWidth:120, inputWidth:120  },
		{ type:"template" , name:"form_template_2", label:"Доступность", value:"На складе"  },
		{ type:"template" , name:"form_template_3", label:"Показать"  },
		{ type:"template" , name:"form_template_1", label:"Больше параметров"  }
	]);

	pf.__define({

		mode: {
			get: function () {

			},
			set: function (v) {

			},
			enumerable: false
		},

		// указывает на объект, определяющий набор свойств для фильтрации
		// например, на элемент справочника _ВидыНоменклатуры_
		parent: {
			get: function () {
				return _parent ? _parent.ref : "";
			},
			set: function (v) {
				// чистим содержимое контейнера
				var child;
				pf.children.forEach(function (child) {
					if(child.destructor)
						child.destructor();
				});
				while (child = _add.lastChild)
					_add.removeChild(child);

				// бежим по свойствам и создаём элементы управления
				mgr.get(v, true, true).then(function (o) {
					if(o){
						_parent = o;
						o = null;
					}
					//_parent.РеквизитыБыстрогоОтбораНоменклатуры
					//РеквизитыБыстрогоОтбораХарактеристик
					//_parent.НаборСвойств.extra_fields.get(0).property
					_parent.РеквизитыБыстрогоОтбораНоменклатуры.each(function (o) {
						if(o.property && !o.property.empty()){
							child = new OMultiCheckbox({
								container: _add,
								property: o.property,
								name: o.ПредставлениеРеквизита
							});
							pf.children.push(child);
						}
					})
				})

			},
			enumerable: false
		},

		/**
		 * Обработчик маршрутизации
		 */
		hash_route: {
			value: function (hprm) {
				if(hprm.obj && pf.parent != hprm.obj){
					pf.parent = hprm.obj;


				}
			}
		}
	});






	$p.eve.hash_route.push(pf.hash_route);
	setTimeout(function () {
		pf.hash_route($p.job_prm.parse_url());
	}, 50);

	return pf;
};
