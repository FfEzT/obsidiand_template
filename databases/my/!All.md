---
ff_l_parent:
  - "[[!_my]]"
---



```dataview
TABLE ff_status, ff_date, frequency, ff_l_parent,
	file.inlinks AS Дети
FROM "databases"
WHERE contains(file.path, this.file.folder)
SORT ff_status ASC, ff_date ASC, ff_timeStart
```
WHERE contains(ff_status, "in progress")
