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
		_width = _cell.getWidth ? _cell.getWidth() : _cell.cell.offsetWidth - 44,
		_add,
		_price,
		_filter_prop = {},
		_parent,
		pf = new function OPropFilter(){
			this.children = [];
			this.form = _cell.attachForm([
				{ type:"settings" , labelWidth:120, inputWidth:120  },
				{ type:"container", name:"price", label:"", inputWidth: _width, inputHeight:50, position: "label-top"},
				{ type:"template" , name:"form_template_2", label:"Доступность", value:"На складе"  },
				{ type:"container", name:"manufacturer", label:"Производитель", inputWidth: _width, inputHeight:20, position: "label-top"},
				{ type:"container", name:"_add", label:"Дополнительно", inputWidth: _width, inputHeight:"auto", position: "label-top"},
				{ type:"template" , name:"form_template_3", label:"Показать"  },
				{ type:"template" , name:"form_template_1", label:"Больше параметров"  }
			]);
		};

	// подключим дополнительные элементы
	//_cell.cell.firstChild.style.overflow = "auto";

	function prop_change(v){
		var changed;
		for(var key in v){
			if(!_filter_prop[key])
				changed = true;
			else if(typeof v[key] == "object"){
				for(var j in v[key])
					if(_filter_prop[key][j] != v[key][j])
						changed = true;
			}
			_filter_prop[key] = v[key];
		}
		if(changed)
			dhx4.callEvent("filter_prop_change", [_filter_prop]);
	}

	// слайдер цены
	_price = new ORangeSlider({
		container: pf.form.getContainer("price"),
		on_change: prop_change,
		name: "Цена",
		synonym: "Цена",
		range: {min: 200, max: 6000},
		start: {min: 600, max: 3000}
	});

	// форма
	//_form.style.width = "100%";
	//_form.style.height = "100px";
	//_cont.appendChild(_form);
	//
	//_add.style.width = "100%";
	//_add.style.height = "100%";
	//_cont.appendChild(_add);


	_add = pf.form.getContainer("_add");

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
