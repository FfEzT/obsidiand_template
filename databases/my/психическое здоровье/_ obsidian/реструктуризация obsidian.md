---
ff_date: 2025-10-25
ff_timeStart: 6h30m
ff_duration: 1h30m
ff_status: 🔵in progress
ff_frequency: 2Quater
---
ff_parent:: [[очистка]]
progress:: `$= dv.view('script/progressView', {file: dv.current().file.name})`

`$= dv.view('script/child');`

---
> [!tip] Раз в год/полгода переруструктуризировать все заметки
> Типа оборвать все связи и начать с нуля их строить
> А еще объединять большие TODO-blocks


> [!warning] Примерно такие домены должны быть
> - Работа
> - Образование
> - Семья
> - отношения (с другими людьми)
> - Хобби
> - Психическое здоровье
> 	- поддержание каледаря
> 	- отдых
> 	- ...
> - физическое здоровье
> - финансовая и материальная сфера
> - обычные дела (дела)
> - события (мероприятия, вечеринки и т.п.)
> - capacity


чтобы легко можно было строить такие графики

```chart
type: radar
labels: [работа, семья, образование, хобби, псих, физ.культ, деньги, capacity]
series:
	-
		title: Title 1
		data: [7,20,10,4,5,11,19,34]
	-
		title: Title 2
		data: [7,15,1,9,4,12,15,3]
width: 100%
labelColors: true
```






Или такие

```chart
    type: pie
    labels: [Monday,Tuesday,Wednesday,Thursday,Friday]
    series:
        -
	        title: Title 1
	        data: [1,2,3,4,5]
        -
	        title: Title 2
	        data: [9,4,3,2,1]
    width: 100%
    labelColors: true
```
