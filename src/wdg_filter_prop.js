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
		_hprm = $p.job_prm.parse_url(),
		pf = new function OPropFilter(){
			this.children = [];
			this.form = _cell.attachForm([
				{ type:"settings" , labelWidth:120, inputWidth:120  },
				{ type:"container", name:"price", label:"", inputWidth: _width, inputHeight:50, position: "label-top"},
				{ type:"checkbox" , name:"store", label:"Есть на складе", labelAlign:"left", position:"label-right", tooltip: "Скрыть тованы, которых нет в наличии"  },
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
				var child,
					price_prop = {
						container: pf.form.getContainer("price"),
						on_change: prop_change,
						name: "Цена",
						synonym: "Цена",
						range: {min: 0, max: 1000000},
						start: {min: 100, max: 100000}
					};

				pf.children.forEach(function (child) {
					if(child.destructor)
						child.destructor();
				});
				while (child = _add.lastChild)
					_add.removeChild(child);

				_filter_prop = {};

				if(v == $p.blank.guid){
					// перестраиваем ценник
					if(_price){
						price_prop.range.min = 0;
						price_prop.range.max = 1000000;
						price_prop.start.min = 100;
						price_prop.start.max = 100000;
						_price.rebuild(price_prop);
					} else
						_price = new ORangeSlider(price_prop);

					return;
				}

				// получаем вид номенклатуры
				_parent = mgr.get(v);

				// слайдер цены - перестраиваем или создаём новый при старте
				price_prop.range.min = _parent.Цена_Мин > 500 ? _parent.Цена_Мин - 500 : 0;
				price_prop.range.max = _parent.Цена_Макс + 500;
				price_prop.start.min = _parent.Цена_Мин;
				price_prop.start.max = _parent.Цена_Макс;
				if(_price)
					_price.rebuild(price_prop);
				else
					_price = new ORangeSlider(price_prop);


				// уточняем производителей
				if(_parent.Производители){
					var values = _parent.Производители.split(",");
					if(values.length > 1){
						child = new OMultiCheckbox({
							container: _add,
							property: {},
							name: "Производители",
							values: values.map(function (ref) { return $p.cat.Производители.get(ref); })
						});
						pf.children.push(child);
					}
				}

				// бежим по свойствам и создаём элементы управления
				_parent.РеквизитыБыстрогоОтбораНоменклатуры.each(function (o) {
					if(o.property && !o.property.empty()){
						child = new OMultiCheckbox({
							container: _add,
							property: o.property,
							name: o.ПредставлениеРеквизита
						});
						pf.children.push(child);
					}
				});

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
		pf.hash_route(_hprm);
	}, 50);

	return pf;
};
