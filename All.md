# без in/out ссылок
```
TABLE ff_date, ff_status
FROM !"templates"
WHERE !file.inlinks
AND !ff_l_parent
AND ff_status
SORT ff_status, ff_date
```

---

# корень и done
```
TABLE file.inlinks
WHERE !ff_l_parent
AND contains(ff_status, "🟢done")
AND ff_status
```

---
# Тики
```
TABLE t
WHERE t
```

---
# All

```datavie
TABLE ff_status, ff_date, frequency, ff_l_parent,
	file.inlinks AS Дети
FROM "databases"
SORT ff_status ASC, ff_date ASC, ff_timeStart
```
WHERE contains(ff_status, "in progress")
---
