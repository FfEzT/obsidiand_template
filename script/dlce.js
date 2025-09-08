function checkCond(obj) {
    if (!!obj.frequency)
        return false

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

    let effort = null
    if (page.ff_duration) {
        effort = page.ff_duration
        effort = effort.as("hours")
    }
    else
        return null


    // NOTE, чтобы из-за effort оценка задачи не сильно падала
    effort = Math.pow(effort, 0.4)

    let ff_impact = page.ff_impact || 0.5
    let ff_confidence = page.ff_confidence || 50
    let result = ff_impact * ff_confidence /
        effort / dur
    result *= 100

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

// ff_status, ff_parent, replace(progress, "current()", PROG) AS progress
for (let page of pages) {
    const _dice = dice(page)

    if (checkCond(page) && _dice) {
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
    }
}

result = result.filter(p => p[2] != null)
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
