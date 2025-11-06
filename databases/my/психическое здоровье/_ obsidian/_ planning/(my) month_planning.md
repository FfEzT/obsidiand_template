---
ff_date: 2025-12-01
ff_timeStart: 12h30m
ff_duration: 1h
ff_status: 🔵in progress
ff_l_parent:
  - "[[!planning]]"
ff_l_responsible:
ff_frequency: month
---
progress:: `$= dv.view('script/progressView', {file: dv.current().file.name})`

`$= dv.view('script/child');`

---
- промежуточные итоги целей за квартал
	- успеваем ли все делать или нет
	- скорректировать планы
