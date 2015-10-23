# Объединение конфигурации _Интеграция_ с типовыми конфигурациями 1С
### Если исходная конфигурация на полной поддержке, включить возможность внесения изменений
- В конфигураторе `Конфигурация` -> `Поддержка` -> `Настройка поддержки` -> `Включить возможность внесения изменений`
- В диалоге `Режим поддержки` указать режим `Объекты поставщика не редактируются`
### Включить возможность изменения следующих объектов исходной конфигурации
- Корень дерева конфигурации для возможности добавления новых объектов
- Роли  `ПолныеПрава` и `УдаленныйДоступСтандартныйИнтерфейсOData`
- Общий реквизит `ОбластьДанныхОсновныеДанные`
### Выполнить объединение с конфигурацией _Интеграция_ с постановкой на поддержку
- В конфигураторе `Конфигурация` -> `Сравнить - объединить с конфигурацией из файла`
- В диалоге `Поставить на поддержку?` ответить `Да`
- В диалоге `Сравнение, объединение`
	+ Снять все `флажки` в разделе `Свойства` (Имя, Синоним, Основные роли и т.д.) 
	+ Для ролей `ПолныеПрава` и `УдаленныйДоступСтандартныйИнтерфейсOData` указать режим `Объединить с приоритетом основной конфигурации`
	+ Для общего реквизита `ОбластьДанныхОсновныеДанные` указать режим `Объединить`
- В диалоге `Настройка правил поддержки`, который появляется после выполнения команды `Объединить`
	+ Для новых и существующих идентичных объектов поставщика, установить режим `Не редактируется`
	+ Для изменённых объектов поставщика установить режим `Редактируется с сохранением поддержки`