dv.execute(`
    TABLE ff_status, ff_date, file.inlinks, replace(progress, "current()", PROG) AS progress
    WHERE contains(file.path, this.file.folder)
        AND !ff_l_parent

    SORT ff_status ASC, file.outlinks ASC, ff_date ASC
    FLATTEN "page('" + file.path + "')" AS PROG
`)
