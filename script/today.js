function parseTextTick(str) {
    const args = str.split(',')
        if (!args)
            return null

        const name = args[0]?.trim()
        const ff_date = dv.date(args[1]?.trim())
        const ff_timeStart = dv.duration(args[2]?.trim())

        const ff_duration = dv.duration(args[3]?.trim())

        if (name == '')
            return null

        return {name, ff_date, ff_timeStart, ff_duration}
}

function parseArrTick(arr) {
    return {
        name: arr[0],
        ff_date: arr[1],
        ff_timeStart: arr[2],
        ff_duration: arr[3]
    }
}

function convertDvToTarr(t) {
    const res = []
    if (typeof t == "string") {
        const tmp = parseTextTick(t)
        tmp && res.push(tmp)
    }
    else if (typeof t[0] == "number") {
        res.push(parseArrTick(t))
    }
    else for (let i of t) {
        res.push(
            ...convertDvToTarr(i)
        )
    }
    return res
}

function checkCond(obj) {
    return obj.ff_date &&
    obj.ff_date < dv.date("tomorrow")
}

const currentDv = dv.current()
let pages = dv.pages()
.where(
    page => page.file.path.startsWith(currentDv.file.folder)
        && page.ff_status
        && !page.ff_status?.contains("done")
)
.sort(p => p.ff_status)
.array()

const result = []
for (let page of pages) {
    if (checkCond(page)) {
        result.push(
            [
                page.file.link,
                page.ff_status,
                page.ff_date,

                // NOTE: если в page.ff_timeStart стоит 0h0m, то в таблице он будет пустой ячейкой
                // а так будет 0h
                page.ff_timeStart?.conversionAccuracy && page.ff_timeStart == ""
                  ? "0h"
                  : page.ff_timeStart,

                page.ff_frequency
            ]
        )
    }
    if (page.t) {
        const tmp = convertDvToTarr(page.t)
        .filter(a => checkCond(a))

        for (let i of tmp) {
            result.push(
                [
                    "("+page.file.link+")"+i.name,
                    page.ff_status,
                    i.ff_date,
                    //
                    // NOTE: если в page.ff_timeStart стоит 0h0m, то в таблице он будет пустой ячейкой
                    // а так будет 0h
                    i.ff_timeStart?.conversionAccuracy && i.ff_timeStart == ""
                      ? "0h"
                      : i.ff_timeStart,

                    ""
                ]
            )
        }
    }
}

result
.sort(
    (a,b) => {
        if (a[3] == "0h")
            return -1
        if (b[3] == "0h")
            return 1

        return a[3] < b[3]? -1:1
    }
)
.sort(
    (a,b) => a[2] < b[2]? -1:1
)


dv.table(
    ["File", "ff_status", "ff_date", "ff_timeStart", "frequency"],
    result
)
