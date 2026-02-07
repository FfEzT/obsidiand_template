dv.execute(`
    TABLE
    length(rows) AS count,
    join(rows.file.link, "<br> - ") AS tasks
    WHERE contains(file.path, this.file.folder)
    FLATTEN ff_l_plan AS sprint
    WHERE sprint
    GROUP BY sprint
    SORT sprint ASC
`)
