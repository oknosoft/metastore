/**
 *
 * Created 07.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  widgets
 * @submodule multi_checkbox
 */

/**
 * ### Визуальный компонент - таблица из двух колонок: чекбокс и значение
 * - Позволяет выбрать N Значений из списка
 * - Унаследован от [dhtmlXGridObject](http://docs.dhtmlx.com/grid__index.html)
 * - Автоматически строит список свойств по элементу плана видов характеристик _ДополнительныеРеквизитыИСведения_
 *
 * @class OMultiCheckbox
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.property {cch.property} - Элемент плана видов характеристик _ДополнительныеРеквизитыИСведения_
 * @constructor
 */
function OMultiCheckbox(attr) {

	var _div = document.createElement("div"),
		_grid = new dhtmlXGridObject(_div);

	_div.classList.add("multi_checkbox");
	attr.container.appendChild(_div);

	// собственно табличная часть
	_grid.setIconsPath(dhtmlx.image_path);
	_grid.setImagePath(dhtmlx.image_path);
	_grid.setHeader("," + attr.name || attr.property.Заголовок || attr.property.name);
	//_grid.setNoHeader(true);
	_grid.setInitWidths("30,*");
	_grid.setColAlign("center,left");
	_grid.setColSorting("na,na");
	_grid.setColTypes("ch,ro");
	_grid.setColumnIds("ch,name");
	_grid.enableAutoWidth(true, 600, 100);
	_grid.enableAutoHeight(true, 180, true);
	_grid.init();

	if(attr.values){
		attr.values.forEach(function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}else if(attr.property.type.is_ref && attr.property.type.types && attr.property.type.types.length == 1){
		$p.md.mgr_by_class_name(attr.property.type.types[0]).find_rows({owner: attr.property}, function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}

	return _grid;

};


