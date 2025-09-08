dv.execute(`
    TABLE ff_frequency, ff_date

    WHERE contains(file.path, this.file.folder)
    AND ff_frequency
    SORT ff_date, ff_timeStart, ff_frequency DESC
`)
