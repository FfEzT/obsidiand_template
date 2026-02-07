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
    if (!!obj.frequency)
        return false

    if (obj.ff_status == "🔵in progress" && obj.ff_deadline)
        return true

    if (varDateDv.ff_endRange && varDateDv.ff_startDay) {
        return obj.ff_date &&
            obj.ff_date < varDateDv.ff_endRange + dv.duration("1d") &&
            obj.ff_date >= varDateDv.ff_startDay
    }

    if (varDateDv.ff_endRange && !varDateDv.ff_startDay)
        return obj.ff_date &&
            obj.ff_date < varDateDv.ff_endRange + dv.duration("1d")

    if (varDateDv.ff_startDay && !varDateDv.ff_endRange)
        return obj.ff_date &&
            obj.ff_date >= varDateDv.ff_startDay


    return true
}

function dice(page) {
    let dur = (
                page.ff_deadline
                ? page.ff_deadline.diffNow()
                : dv.duration("14d")
        ).as("hour")
    dur = Math.max(dur, 1) || 1

    let ff_impact = page.ff_impact || 0.25

    let ff_confidence = page.ff_confidence
    if (page.ff_confidence != 0 && !page.ff_confidence) {
        ff_confidence = 4
    }
    ff_confidence *= 25

    let effort = null
    if (page.ff_duration) {
        effort = page.ff_duration.as("hours")
    }
    else if (page.ff_deadline) {
        effort = dv.duration("1h30m").as("hours")

        if (!page.ff_impact) {
            ff_impact = 1
        }
    }
    else {
        return null
    }

    // NOTE, чтобы из-за effort оценка задачи не сильно падала
    effort = Math.pow(effort, 0.4)


    let result = ff_impact * ff_confidence /
        effort / dur
    result *= 100

    const blockersDice = getAllLinks(page.file.path, '')['ff_l_blocks']
        ?.map(dice)

    if (blockersDice && blockersDice.length > 0)
        result += Math.max(...blockersDice)

    return Math.floor(result * 1000) / 1000
}

const varDateDv = dv.page("var/date")
const currentDv = dv.current()
let pages = dv.pages()
.where(
        page => page.file.path.startsWith(currentDv.file.folder)
        && page.ff_status
        && !page.ff_status?.contains("done")
        && page.ff_status == "🔵in progress"
)
.sort(p => p.ff_status)
.sort(p => p.ff_deadline)
.sort(p => p.ff_impact)
.sort(p => p.ff_confidence)
.sort(p => p.ff_duration)
.array()

let result = []

// ff_status, ff_l_parent, replace(progress, "current()", PROG) AS progress
for (let page of pages) {
    const _dice = dice(page)

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

                page.ff_duration,
                _dice,
                page.ff_deadline,
                page.ff_impact,
                page.ff_confidence,
            ]
        )
        if (page.t) {
            const tmp = convertDvToTarr(page.t)
                .filter(a => checkCond(a))

            for (let i of tmp) {
                result.push(
                    [
                        "("+page.file.link+")"+i.name,
                        page.ff_status,
                        i.ff_date,

                        // NOTE: если в page.ff_timeStart стоит 0h0m, то в таблице он будет пустой ячейкой
                        // а так будет 0h
                        i.ff_timeStart?.conversionAccuracy && i.ff_timeStart == ""
                          ? "0h"
                          : i.ff_timeStart,

                        i.ff_duration,
                        _dice,
                        page.ff_deadline,
                        page.ff_impact,
                        page.ff_confidence,
                    ]
                )
            }
        }
    }
}

result = result
// .filter(p => p[2] != null)
.sort(
        (a, b) => {
                if (!a[6] && b[6])
                        return 1
                if (!b[6] && a[6])
                        return -1
                if (a[6]?.ts == b[6]?.ts && a[5] <= b[5]) {
                        return 1
                }
                if (a[6]?.ts == b[6]?.ts && a[5] > b[5]) {
                        return -1
                }
                return a[6] > b[6]? 1:-1
        }
)

dv.table(
    ["File", "ff_status", "ff_date", "ff_startTime", "ff_duration", "dice", "ff_deadline", "ff_impact", "ff_confidence"],
    result
)



function getLinkClass() {
    // Создаем временную ссылку для определения класса
    const tempPage = dv.current()
    if (tempPage && tempPage.file && tempPage.file.link) {
        return tempPage.file.link.constructor
    }
    return null
}

function getRelatedFields(page, searchingPath) {
    const Link = getLinkClass()

    const keys = []
    for (let key in page) {
        const val = page[key]

        if (val instanceof Link) {
            if (val?.path === searchingPath)
                keys.push(key)

            continue
        }
        if ( !(val instanceof Array) )
            continue

        for (let link of val) {
            if ( !(link instanceof Link) )
                continue

            if (link?.path === searchingPath) {
                keys.push(key)

                break
            }
        }
    }
    return keys
}

function getAllLinks(currentPath, defaultField) {
    let pages = dv.page(currentPath).file.inlinks
        // .sort(p => p.ff_status).sort(p => p.ff_date)
        .array()
        .map(a => a.path)
        .map(a => dv.page(a))

    // mapping: fieldName -> List[page]
    const result = {}
    result[defaultField] = []

    for (let page of pages) {
        const keys = getRelatedFields(page, currentPath)

        for (let key of keys) {
            if ( !(result[key] instanceof Array) )
                result[key] = []

            result[key].push(page)
        }
        if (keys.length == 0)
            result[defaultField].push(page)
    }

    return result
}

